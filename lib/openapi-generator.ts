import { Endpoint, HttpMethod } from "@/app/generated/prisma";

export interface SchemaDefinition {
  [key: string]: {
    type: string;
    format?: string;
    enum?: string[];
    min?: number;
    max?: number;
  };
}

interface OpenAPISchema {
  type: string;
  format?: string;
  enum?: string[];
  minimum?: number;
  maximum?: number;
  example?: unknown;
  description?: string;
}

interface OpenAPIParameter {
  name: string;
  in: "query" | "header" | "path";
  required?: boolean;
  schema: OpenAPISchema;
  description?: string;
}

interface OpenAPIResponse {
  description: string;
  content?: {
    "application/json": {
      schema: OpenAPISchema | { type: "array"; items: OpenAPISchema };
      example?: unknown;
    };
  };
  headers?: Record<string, { schema: { type: string }; description?: string }>;
}

interface OpenAPIPath {
  summary?: string;
  description?: string;
  parameters?: OpenAPIParameter[];
  requestBody?: {
    required: boolean;
    content: {
      "application/json": {
        schema: OpenAPISchema;
      };
    };
  };
  responses: Record<string, OpenAPIResponse>;
  tags?: string[];
  security?: Array<Record<string, string[]>>;
}

interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    description?: string;
    version: string;
  };
  servers: Array<{
    url: string;
    description: string;
  }>;
  paths: Record<string, Record<string, OpenAPIPath>>;
  components?: {
    securitySchemes?: Record<string, unknown>;
    schemas?: Record<string, OpenAPISchema>;
  };
  tags?: Array<{ name: string; description?: string }>;
}

/**
 * Convert our schema definition to OpenAPI schema
 */
function convertToOpenAPISchema(schema: SchemaDefinition): OpenAPISchema {
  const properties: Record<string, OpenAPISchema> = {};
  const required: string[] = [];

  for (const [field, def] of Object.entries(schema)) {
    const prop: OpenAPISchema = {
      type: mapTypeToOpenAPI(def.type),
    };

    // Add format
    if (def.format) {
      prop.format = def.format;
    } else if (def.type === "email") {
      prop.format = "email";
    } else if (def.type === "url") {
      prop.format = "uri";
    } else if (def.type === "date") {
      prop.format = "date-time";
    } else if (def.type === "uuid") {
      prop.format = "uuid";
    }

    // Add enum
    if (def.enum && def.enum.length > 0) {
      prop.enum = def.enum;
    }

    // Add min/max
    if (def.min !== undefined) {
      prop.minimum = def.min;
    }
    if (def.max !== undefined) {
      prop.maximum = def.max;
    }

    // Add example
    prop.example = generateExample(def.type, def);

    properties[field] = prop;
  }

  return {
    type: "object",
    ...({ properties } as any),
    ...(required.length > 0 ? { required } : {}),
  };
}

/**
 * Map our schema types to OpenAPI types
 */
function mapTypeToOpenAPI(type: string): string {
  const typeMap: Record<string, string> = {
    string: "string",
    number: "number",
    integer: "integer",
    boolean: "boolean",
    email: "string",
    url: "string",
    date: "string",
    uuid: "string",
    text: "string",
  };

  return typeMap[type] || "string";
}

/**
 * Generate example value for a field type
 */
function generateExample(type: string, def: { enum?: string[]; min?: number; max?: number }): unknown {
  if (def.enum && def.enum.length > 0) {
    return def.enum[0];
  }

  const examples: Record<string, unknown> = {
    string: "example string",
    number: def.min ?? 42,
    integer: def.min ?? 1,
    boolean: true,
    email: "user@example.com",
    url: "https://example.com",
    date: "2024-01-01T00:00:00Z",
    uuid: "123e4567-e89b-12d3-a456-426614174000",
    text: "Example text content",
  };

  return examples[type] || "example";
}

/**
 * Generate OpenAPI 3.0 specification from endpoints
 */
export function generateOpenAPISpec(
  projectName: string,
  projectDescription: string | null,
  projectSlug: string,
  endpoints: Array<
    Pick<
      Endpoint,
      | "id"
      | "name"
      | "path"
      | "method"
      | "description"
      | "schema"
      | "responseCode"
      | "responseHeaders"
      | "isArray"
      | "arrayCount"
      | "pagination"
      | "authRequired"
      | "delay"
    >
  >
): OpenAPISpec {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const apiBaseUrl = `${baseUrl}/api/mock/${projectSlug}`;

  const spec: OpenAPISpec = {
    openapi: "3.0.3",
    info: {
      title: projectName,
      description: projectDescription || `Mock API for ${projectName}`,
      version: "1.0.0",
    },
    servers: [
      {
        url: apiBaseUrl,
        description: "Mock API Server",
      },
    ],
    paths: {},
  };

  // Group endpoints by path
  const pathGroups: Record<string, Array<typeof endpoints[0]>> = {};
  for (const endpoint of endpoints) {
    if (!pathGroups[endpoint.path]) {
      pathGroups[endpoint.path] = [];
    }
    pathGroups[endpoint.path].push(endpoint);
  }

  // Convert each endpoint to OpenAPI path
  for (const [path, endpointGroup] of Object.entries(pathGroups)) {
    spec.paths[path] = {};

    for (const endpoint of endpointGroup) {
      const method = endpoint.method.toLowerCase();
      const schema = endpoint.schema as SchemaDefinition;
      const openAPISchema = convertToOpenAPISchema(schema);

      const pathItem: OpenAPIPath = {
        summary: endpoint.name || `${endpoint.method} ${endpoint.path}`,
        description: endpoint.description || undefined,
        responses: {},
      };

      // Add request body for POST/PUT/PATCH
      if (["post", "put", "patch"].includes(method)) {
        pathItem.requestBody = {
          required: true,
          content: {
            "application/json": {
              schema: openAPISchema,
            },
          },
        };
      }

      // Add response
      const responseSchema = endpoint.isArray
        ? {
            type: "array" as const,
            items: openAPISchema,
          }
        : openAPISchema;

      // Add pagination wrapper if enabled
      const finalResponseSchema = endpoint.pagination
        ? {
            type: "object" as const,
            properties: {
              data: responseSchema,
              meta: {
                type: "object" as const,
                properties: {
                  page: { type: "integer" as const, example: 1 },
                  limit: { type: "integer" as const, example: 10 },
                  total: { type: "integer" as const, example: endpoint.arrayCount },
                  totalPages: { type: "integer" as const, example: Math.ceil(endpoint.arrayCount / 10) },
                },
              },
            },
          }
        : responseSchema;

      const response: OpenAPIResponse = {
        description: "Successful response",
        content: {
          "application/json": {
            schema: finalResponseSchema as any,
          },
        },
      };

      // Add response headers
      if (endpoint.responseHeaders && typeof endpoint.responseHeaders === "object") {
        response.headers = {};
        for (const [headerName, headerValue] of Object.entries(endpoint.responseHeaders)) {
          response.headers[headerName] = {
            schema: { type: "string" },
            description: String(headerValue),
          };
        }
      }

      pathItem.responses[String(endpoint.responseCode)] = response;

      // Add common error responses
      pathItem.responses["401"] = {
        description: "Unauthorized - API key required",
      };
      pathItem.responses["429"] = {
        description: "Too Many Requests - Rate limit exceeded",
      };

      // Add query parameters for pagination
      if (endpoint.pagination) {
        pathItem.parameters = [
          {
            name: "page",
            in: "query",
            schema: { type: "integer", minimum: 1 },
            description: "Page number",
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", minimum: 1, maximum: 100 },
            description: "Items per page",
          },
        ];
      }

      // Add security if auth required
      if (endpoint.authRequired) {
        pathItem.security = [{ ApiKeyAuth: [] }];
      }

      spec.paths[path][method] = pathItem;
    }
  }

  // Add security schemes if any endpoint requires auth
  const hasAuth = endpoints.some((e) => e.authRequired);
  if (hasAuth) {
    spec.components = {
      securitySchemes: {
        ApiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "X-API-Key",
          description: "API key for authentication",
        },
      },
    };
  }

  return spec;
}
