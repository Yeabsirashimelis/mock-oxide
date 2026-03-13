import { SchemaDefinition } from "./types";

interface ValidationError {
  field: string;
  message: string;
}

export function validateRequestBody(
  body: unknown,
  schema: SchemaDefinition
): { valid: boolean; errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return {
      valid: false,
      errors: [{ field: "body", message: "Request body must be a valid JSON object" }],
    };
  }

  const bodyObj = body as Record<string, unknown>;

  // Validate each field in the schema
  for (const [field, fieldDef] of Object.entries(schema)) {
    const value = bodyObj[field];

    // Check if field exists (optional validation - we don't require all fields)
    if (value === undefined || value === null) {
      continue; // Allow missing fields
    }

    // Get the field type
    let fieldType: string;
    if (typeof fieldDef === "string") {
      fieldType = fieldDef;
    } else if (typeof fieldDef === "object" && fieldDef !== null && "type" in fieldDef) {
      fieldType = (fieldDef as any).type;
    } else {
      continue; // Skip nested objects for now
    }

    // Validate based on type
    const error = validateFieldType(field, value, fieldType);
    if (error) {
      errors.push(error);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function validateFieldType(
  field: string,
  value: unknown,
  fieldType: string
): ValidationError | null {
  // Handle array type
  if (fieldType.startsWith("array:")) {
    if (!Array.isArray(value)) {
      return { field, message: `Field '${field}' must be an array` };
    }
    return null;
  }

  // Handle enum type
  if (fieldType.startsWith("enum:")) {
    const enumValues = fieldType.substring(5).split(",");
    if (typeof value !== "string" || !enumValues.includes(value)) {
      return {
        field,
        message: `Field '${field}' must be one of: ${enumValues.join(", ")}`,
      };
    }
    return null;
  }

  // Handle range types (integer:min-max, number:min-max)
  if (fieldType.includes(":") && (fieldType.startsWith("integer") || fieldType.startsWith("number"))) {
    const [baseType, range] = fieldType.split(":");
    if (typeof value !== "number") {
      return { field, message: `Field '${field}' must be a number` };
    }
    if (range && range.includes("-")) {
      const [min, max] = range.split("-").map(Number);
      if (value < min || value > max) {
        return {
          field,
          message: `Field '${field}' must be between ${min} and ${max}`,
        };
      }
    }
    return null;
  }

  // Type mapping
  const typeValidators: Record<string, (v: unknown) => boolean> = {
    // String types
    string: (v) => typeof v === "string",
    email: (v) => typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    url: (v) => typeof v === "string",
    uuid: (v) => typeof v === "string",
    password: (v) => typeof v === "string",
    text: (v) => typeof v === "string",
    word: (v) => typeof v === "string",
    sentence: (v) => typeof v === "string",
    paragraph: (v) => typeof v === "string",
    fullName: (v) => typeof v === "string",
    firstName: (v) => typeof v === "string",
    lastName: (v) => typeof v === "string",
    username: (v) => typeof v === "string",
    phoneNumber: (v) => typeof v === "string",
    address: (v) => typeof v === "string",
    city: (v) => typeof v === "string",
    country: (v) => typeof v === "string",
    zipCode: (v) => typeof v === "string",
    company: (v) => typeof v === "string",
    jobTitle: (v) => typeof v === "string",
    color: (v) => typeof v === "string",
    avatar: (v) => typeof v === "string",
    image: (v) => typeof v === "string",
    productName: (v) => typeof v === "string",
    productDescription: (v) => typeof v === "string",
    category: (v) => typeof v === "string",
    department: (v) => typeof v === "string",

    // Number types
    number: (v) => typeof v === "number",
    integer: (v) => typeof v === "number" && Number.isInteger(v),
    float: (v) => typeof v === "number",
    price: (v) => typeof v === "number" && v >= 0,
    age: (v) => typeof v === "number" && Number.isInteger(v) && v >= 0,
    rating: (v) => typeof v === "number",
    percentage: (v) => typeof v === "number" && v >= 0 && v <= 100,
    latitude: (v) => typeof v === "number" && v >= -90 && v <= 90,
    longitude: (v) => typeof v === "number" && v >= -180 && v <= 180,

    // Boolean
    boolean: (v) => typeof v === "boolean",

    // Date/time (accept string or Date)
    date: (v) => typeof v === "string" || v instanceof Date,
    datetime: (v) => typeof v === "string" || v instanceof Date,
    timestamp: (v) => typeof v === "number" || typeof v === "string",
  };

  const validator = typeValidators[fieldType];
  if (validator) {
    if (!validator(value)) {
      return {
        field,
        message: `Field '${field}' has invalid type (expected ${fieldType})`,
      };
    }
  }

  return null;
}
