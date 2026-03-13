import { HttpMethod } from "@/app/generated/prisma";

interface OpenAPISchema {
  type?: string;
  format?: string;
  enum?: string[];
  minimum?: number;
  maximum?: number;
  properties?: Record<string, OpenAPISchema>;
  items?: OpenAPISchema;
  required?: string[];
  example?: unknown;
  description?: string;
}

interface OpenAPIParameter {
  name: string;
  in: "query" | "header" | "path";
  required?: boolean;
  schema?: OpenAPISchema;
  description?: string;
}

interface OpenAPIRequestBody {
  required?: boolean;
  content?: {
    "application/json"?: {
      schema?: OpenAPISchema;
    };
  };
}

interface OpenAPIResponse {
  description?: string;
  content?: {
    "application/json"?: {
      schema?: OpenAPISchema;
    };
  };
  headers?: Record<string, { schema?: { type?: string }; description?: string }>;
}

interface OpenAPIOperation {
  summary?: string;
  description?: string;
  operationId?: string;
  tags?: string[];
  parameters?: OpenAPIParameter[];
  requestBody?: OpenAPIRequestBody;
  responses?: Record<string, OpenAPIResponse>;
  security?: Array<Record<string, string[]>>;
}

interface OpenAPIPath {
  get?: OpenAPIOperation;
  post?: OpenAPIOperation;
  put?: OpenAPIOperation;
  patch?: OpenAPIOperation;
  delete?: OpenAPIOperation;
  options?: OpenAPIOperation;
  head?: OpenAPIOperation;
}

interface OpenAPISpec {
  openapi?: string;
  swagger?: string;
  info?: {
    title?: string;
    description?: string;
    version?: string;
  };
  servers?: Array<{
    url?: string;
    description?: string;
  }>;
  paths?: Record<string, OpenAPIPath>;
  components?: {
    schemas?: Record<string, OpenAPISchema>;
    securitySchemes?: Record<string, unknown>;
  };
}

export interface ImportedEndpoint {
  name: string;
  path: string;
  method: HttpMethod;
  description: string | null;
  schema: Record<string, unknown>;
  responseCode: number;
  responseHeaders: Record<string, string> | null;
  isArray: boolean;
  arrayCount: number;
  pagination: boolean;
  authRequired: boolean;
  delay: number;
  validateRequest: boolean;
}

/**
 * Convert OpenAPI type to our schema type
 */
function mapOpenAPITypeToSchemaType(
  schema: OpenAPISchema
): { type: string; format?: string; enum?: string[]; min?: number; max?: number } {
  const baseType = schema.type || "string";

  // Handle enums
  if (schema.enum && schema.enum.length > 0) {
    return {
      type: "enum",
      enum: schema.enum,
    };
  }

  // Handle format-specific types
  if (schema.format) {
    const formatMap: Record<string, string> = {
      email: "email",
      uri: "url",
      url: "url",
      uuid: "uuid",
      "date-time": "date",
      date: "date",
    };

    if (formatMap[schema.format]) {
      return { type: formatMap[schema.format] };
    }
  }

  // Handle basic types
  const typeMap: Record<string, string> = {
    string: "string",
    number: "number",
    integer: "integer",
    boolean: "boolean",
  };

  const result: any = {
    type: typeMap[baseType] || "string",
  };

  // Add min/max
  if (schema.minimum !== undefined) {
    result.min = schema.minimum;
  }
  if (schema.maximum !== undefined) {
    result.max = schema.maximum;
  }

  return result;
}

/**
 * Convert OpenAPI schema to our schema definition
 */
function convertOpenAPISchemaToSchemaDefinition(
  schema: OpenAPISchema
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  // Handle object with properties
  if (schema.type === "object" && schema.properties) {
    for (const [propName, propSchema] of Object.entries(schema.properties)) {
      result[propName] = mapOpenAPITypeToSchemaType(propSchema);
    }
  }
  // Handle array items
  else if (schema.type === "array" && schema.items) {
    if (schema.items.type === "object" && schema.items.properties) {
      for (const [propName, propSchema] of Object.entries(schema.items.properties)) {
        result[propName] = mapOpenAPITypeToSchemaType(propSchema);
      }
    }
  }
  // Fallback: create a simple field
  else {
    result.value = mapOpenAPITypeToSchemaType(schema);
  }

  return result;
}

/**
 * Extract response schema from OpenAPI operation
 */
function extractResponseSchema(operation: OpenAPIOperation): {
  schema: Record<string, unknown>;
  isArray: boolean;
  responseCode: number;
  responseHeaders: Record<string, string> | null;
} {
  let schema: Record<string, unknown> = { id: { type: "uuid" } };
  let isArray = false;
  let responseCode = 200;
  let responseHeaders: Record<string, string> | null = null;

  // Find first successful response (2xx)
  if (operation.responses) {
    for (const [code, response] of Object.entries(operation.responses)) {
      const statusCode = parseInt(code);
      if (statusCode >= 200 && statusCode < 300) {
        responseCode = statusCode;

        // Extract schema
        const content = response.content?.["application/json"];
        if (content?.schema) {
          const responseSchema = content.schema;

          // Check if response is an array
          if (responseSchema.type === "array") {
            isArray = true;
            if (responseSchema.items) {
              schema = convertOpenAPISchemaToSchemaDefinition(responseSchema.items);
            }
          }
          // Check if response is paginated (has data array)
          else if (
            responseSchema.type === "object" &&
            responseSchema.properties?.data &&
            (responseSchema.properties.data as OpenAPISchema).type === "array"
          ) {
            isArray = true;
            const dataSchema = responseSchema.properties.data as OpenAPISchema;
            if (dataSchema.items) {
              schema = convertOpenAPISchemaToSchemaDefinition(dataSchema.items);
            }
          }
          // Regular object response
          else {
            schema = convertOpenAPISchemaToSchemaDefinition(responseSchema);
          }
        }

        // Extract response headers
        if (response.headers) {
          responseHeaders = {};
          for (const [headerName, headerDef] of Object.entries(response.headers)) {
            responseHeaders[headerName] = headerDef.description || "custom-header";
          }
        }

        break; // Use first successful response
      }
    }
  }

  return { schema, isArray, responseCode, responseHeaders };
}

/**
 * Parse OpenAPI/Swagger spec and convert to our endpoint format
 */
export function parseOpenAPISpec(spec: OpenAPISpec): {
  endpoints: ImportedEndpoint[];
  errors: string[];
} {
  const endpoints: ImportedEndpoint[] = [];
  const errors: string[] = [];

  // Validate spec version
  if (!spec.openapi && !spec.swagger) {
    errors.push("Invalid OpenAPI/Swagger spec: missing version field");
    return { endpoints, errors };
  }

  // Parse paths
  if (!spec.paths || Object.keys(spec.paths).length === 0) {
    errors.push("No paths found in OpenAPI spec");
    return { endpoints, errors };
  }

  for (const [path, pathItem] of Object.entries(spec.paths)) {
    const methods: Array<keyof OpenAPIPath> = [
      "get",
      "post",
      "put",
      "patch",
      "delete",
      "options",
      "head",
    ];

    for (const method of methods) {
      const operation = pathItem[method];
      if (!operation) continue;

      try {
        // Extract response schema
        const { schema, isArray, responseCode, responseHeaders } =
          extractResponseSchema(operation);

        // Check for authentication
        const authRequired = Boolean(operation.security && operation.security.length > 0);

        // Determine if request body validation should be enabled
        const validateRequest =
          method !== "get" &&
          method !== "delete" &&
          Boolean(operation.requestBody?.required);

        // Create endpoint
        const endpoint: ImportedEndpoint = {
          name: operation.summary || operation.operationId || `${method.toUpperCase()} ${path}`,
          path: path,
          method: method.toUpperCase() as HttpMethod,
          description: operation.description || null,
          schema,
          responseCode,
          responseHeaders,
          isArray,
          arrayCount: isArray ? 10 : 1,
          pagination: false,
          authRequired,
          delay: 0,
          validateRequest,
        };

        endpoints.push(endpoint);
      } catch (error) {
        errors.push(
          `Failed to parse ${method.toUpperCase()} ${path}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    }
  }

  if (endpoints.length === 0) {
    errors.push("No valid endpoints found in OpenAPI spec");
  }

  return { endpoints, errors };
}

/**
 * Validate and parse OpenAPI spec from JSON or YAML string
 */
export function validateAndParseOpenAPI(content: string): {
  spec: OpenAPISpec | null;
  error: string | null;
} {
  try {
    let spec: OpenAPISpec;

    // Try parsing as JSON first
    try {
      spec = JSON.parse(content) as OpenAPISpec;
    } catch {
      // If JSON parsing fails, try YAML
      try {
        // Dynamic import of js-yaml for YAML parsing
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const yaml = require("js-yaml");
        spec = yaml.load(content) as OpenAPISpec;
      } catch (yamlError) {
        return {
          spec: null,
          error: `Failed to parse content as JSON or YAML: ${
            yamlError instanceof Error ? yamlError.message : "Unknown error"
          }`,
        };
      }
    }

    // Basic validation
    if (!spec.openapi && !spec.swagger) {
      return {
        spec: null,
        error: "Invalid OpenAPI/Swagger spec: missing version field (openapi or swagger)",
      };
    }

    if (!spec.paths) {
      return {
        spec: null,
        error: "Invalid OpenAPI/Swagger spec: missing paths",
      };
    }

    return { spec, error: null };
  } catch (error) {
    return {
      spec: null,
      error: `Failed to parse spec: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}
