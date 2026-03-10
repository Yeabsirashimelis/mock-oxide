import { faker } from "@faker-js/faker";
import { SchemaDefinition } from "./types";

// ============================================
// TYPES
// ============================================

interface GeneratorOptions {
  seed?: number;
  locale?: string;
}

interface PaginationParams {
  page: number;
  limit: number;
  total: number;
}

// ============================================
// MAIN GENERATOR
// ============================================

export function generateMockData(
  schema: SchemaDefinition,
  options?: GeneratorOptions
): unknown {
  if (options?.seed) {
    faker.seed(options.seed);
  }

  return generateFromSchema(schema);
}

export function generateMockArray(
  schema: SchemaDefinition,
  count: number,
  options?: GeneratorOptions
): unknown[] {
  if (options?.seed) {
    faker.seed(options.seed);
  }

  return Array.from({ length: count }, (_, index) => {
    // Add incremental ID if schema has id field
    const data = generateFromSchema(schema);
    if (typeof data === "object" && data !== null && "id" in schema) {
      return { ...data, _index: index + 1 };
    }
    return data;
  });
}

export function generatePaginatedResponse(
  schema: SchemaDefinition,
  pagination: PaginationParams,
  options?: GeneratorOptions
) {
  const { page, limit, total } = pagination;
  const totalPages = Math.ceil(total / limit);
  const actualCount = Math.min(limit, Math.max(0, total - (page - 1) * limit));

  const data = generateMockArray(schema, actualCount, options);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

// ============================================
// SCHEMA PARSER
// ============================================

function generateFromSchema(schema: SchemaDefinition): unknown {
  if (typeof schema === "string") {
    return generateValue(schema);
  }

  if (typeof schema !== "object" || schema === null) {
    return schema;
  }

  // Check if it's a field definition with type property
  if ("type" in schema && typeof schema.type === "string") {
    const value = generateValue(schema.type as string);
    if (schema.nullable && Math.random() < 0.2) {
      return null;
    }
    return value;
  }

  // It's a nested object
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(schema)) {
    if (typeof value === "string") {
      result[key] = generateValue(value);
    } else if (typeof value === "object" && value !== null) {
      const valueObj = value as Record<string, unknown>;
      if ("type" in valueObj && typeof valueObj.type === "string") {
        const generated = generateValue(valueObj.type);
        if (valueObj.nullable && Math.random() < 0.2) {
          result[key] = null;
        } else {
          result[key] = generated;
        }
      } else {
        // Nested object
        result[key] = generateFromSchema(value as SchemaDefinition);
      }
    } else {
      result[key] = value;
    }
  }

  return result;
}

// ============================================
// VALUE GENERATOR
// ============================================

function generateValue(typeStr: string): unknown {
  // Handle nullable types (e.g., "string?")
  const isNullable = typeStr.endsWith("?");
  const type = isNullable ? typeStr.slice(0, -1) : typeStr;

  if (isNullable && Math.random() < 0.2) {
    return null;
  }

  // Handle array types (e.g., "array:user:10" or "string[]" or "array:5")
  if (type.startsWith("array:") || type.endsWith("[]")) {
    return handleArrayType(type);
  }

  // Handle enum types (e.g., "enum:active,pending,inactive")
  if (type.startsWith("enum:")) {
    return handleEnumType(type);
  }

  // Handle range types (e.g., "integer:18-65" or "number:0-100")
  if (type.includes(":") && type.match(/^(integer|number):\d+-\d+$/)) {
    return handleRangeType(type);
  }

  // Handle regex types (e.g., "regex:[A-Z]{3}-[0-9]{4}")
  if (type.startsWith("regex:")) {
    return handleRegexType(type);
  }

  // Handle basic types
  return generateBasicType(type);
}

// ============================================
// TYPE HANDLERS
// ============================================

function handleArrayType(type: string): unknown[] {
  let itemType = "string";
  let count = 5;

  if (type.endsWith("[]")) {
    itemType = type.slice(0, -2);
  } else if (type.startsWith("array:")) {
    const parts = type.slice(6).split(":");
    if (parts.length === 1) {
      // array:5 - array of 5 strings
      count = parseInt(parts[0], 10) || 5;
    } else {
      // array:type:count
      itemType = parts[0];
      count = parseInt(parts[1], 10) || 5;
    }
  }

  return Array.from({ length: count }, () => generateValue(itemType));
}

function handleEnumType(type: string): string {
  const values = type.slice(5).split(",").map((v) => v.trim());
  return faker.helpers.arrayElement(values);
}

function handleRangeType(type: string): number {
  const [baseType, range] = type.split(":");
  const [min, max] = range.split("-").map(Number);

  if (baseType === "integer") {
    return faker.number.int({ min, max });
  }
  return faker.number.float({ min, max, fractionDigits: 2 });
}

function handleRegexType(type: string): string {
  const pattern = type.slice(6);
  return faker.helpers.fromRegExp(pattern);
}

function generateBasicType(type: string): unknown {
  const generators: Record<string, () => unknown> = {
    // Identifiers
    uuid: () => faker.string.uuid(),
    cuid: () => faker.string.alphanumeric(25),
    id: () => faker.string.uuid(),

    // Strings
    string: () => faker.lorem.word(),
    text: () => faker.lorem.sentence(),
    word: () => faker.lorem.word(),
    words: () => faker.lorem.words(3),
    sentence: () => faker.lorem.sentence(),
    sentences: () => faker.lorem.sentences(2),
    paragraph: () => faker.lorem.paragraph(),
    paragraphs: () => faker.lorem.paragraphs(2),
    slug: () => faker.helpers.slugify(faker.lorem.words(3)).toLowerCase(),

    // Numbers
    number: () => faker.number.float({ min: 0, max: 1000, fractionDigits: 2 }),
    integer: () => faker.number.int({ min: 0, max: 1000 }),
    int: () => faker.number.int({ min: 0, max: 1000 }),
    float: () => faker.number.float({ min: 0, max: 1000, fractionDigits: 2 }),
    price: () => faker.number.float({ min: 1, max: 999, fractionDigits: 2 }),

    // Boolean
    boolean: () => faker.datatype.boolean(),
    bool: () => faker.datatype.boolean(),

    // Dates
    date: () => faker.date.recent({ days: 365 }).toISOString().split("T")[0],
    datetime: () => faker.date.recent({ days: 365 }).toISOString(),
    timestamp: () => faker.date.recent({ days: 365 }).getTime(),
    past: () => faker.date.past().toISOString(),
    future: () => faker.date.future().toISOString(),

    // Personal
    firstName: () => faker.person.firstName(),
    lastname: () => faker.person.lastName(),
    lastName: () => faker.person.lastName(),
    fullName: () => faker.person.fullName(),
    name: () => faker.person.fullName(),
    username: () => faker.internet.username(),
    bio: () => faker.person.bio(),
    gender: () => faker.person.sex(),
    age: () => faker.number.int({ min: 18, max: 80 }),

    // Contact
    email: () => faker.internet.email(),
    phone: () => faker.phone.number(),

    // Internet
    url: () => faker.internet.url(),
    website: () => faker.internet.url(),
    avatar: () => faker.image.avatar(),
    image: () => faker.image.url(),
    imageUrl: () => faker.image.url(),
    ip: () => faker.internet.ip(),
    ipv4: () => faker.internet.ip(),
    ipv6: () => faker.internet.ipv6(),
    mac: () => faker.internet.mac(),
    userAgent: () => faker.internet.userAgent(),
    password: () => faker.internet.password(),

    // Location
    address: () => faker.location.streetAddress(),
    street: () => faker.location.street(),
    city: () => faker.location.city(),
    state: () => faker.location.state(),
    country: () => faker.location.country(),
    countryCode: () => faker.location.countryCode(),
    zipCode: () => faker.location.zipCode(),
    zip: () => faker.location.zipCode(),
    latitude: () => faker.location.latitude(),
    lat: () => faker.location.latitude(),
    longitude: () => faker.location.longitude(),
    lng: () => faker.location.longitude(),
    coordinates: () => ({
      lat: faker.location.latitude(),
      lng: faker.location.longitude(),
    }),

    // Company
    company: () => faker.company.name(),
    companyName: () => faker.company.name(),
    jobTitle: () => faker.person.jobTitle(),
    job: () => faker.person.jobTitle(),
    department: () => faker.commerce.department(),

    // Commerce
    product: () => faker.commerce.productName(),
    productName: () => faker.commerce.productName(),
    productDescription: () => faker.commerce.productDescription(),
    category: () => faker.commerce.department(),

    // Finance
    creditCard: () => faker.finance.creditCardNumber(),
    creditCardCVV: () => faker.finance.creditCardCVV(),
    currency: () => faker.finance.currencyCode(),
    currencyName: () => faker.finance.currencyName(),
    bitcoin: () => faker.finance.bitcoinAddress(),

    // Colors
    color: () => faker.color.human(),
    hexColor: () => faker.color.rgb(),
    hex: () => faker.color.rgb(),
    rgb: () => faker.color.rgb(),
    hsl: () => faker.color.hsl(),

    // Misc
    emoji: () => faker.internet.emoji(),
    json: () => ({}),
    object: () => ({}),
    null: () => null,

    // Status
    status: () => faker.helpers.arrayElement(["active", "inactive", "pending"]),
  };

  const generator = generators[type.toLowerCase()] || generators[type];

  if (generator) {
    return generator();
  }

  // Check if it looks like a nested type reference
  if (type.match(/^[a-z][a-zA-Z0-9]*$/)) {
    // Unknown type, return as string
    return faker.lorem.word();
  }

  // Return the type as-is if we don't recognize it (could be a literal)
  return type;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

export function setLocale(locale: string) {
  // Faker.js supports multiple locales
  // This would require dynamic import in production
  faker.setDefaultRefDate(new Date());
}

export function setSeed(seed: number) {
  faker.seed(seed);
}

export function resetSeed() {
  faker.seed();
}

// ============================================
// SCHEMA VALIDATION
// ============================================

export function validateSchema(schema: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (typeof schema !== "object" || schema === null) {
    errors.push("Schema must be an object");
    return { valid: false, errors };
  }

  function validate(obj: Record<string, unknown>, path: string = "") {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;

      if (typeof value === "string") {
        // Valid string type
        continue;
      } else if (typeof value === "object" && value !== null) {
        if ("type" in value && typeof value.type === "string") {
          // Valid field definition
          continue;
        }
        // Nested object - recurse
        validate(value as Record<string, unknown>, currentPath);
      } else if (value === null || value === undefined) {
        errors.push(`Invalid value at ${currentPath}: null or undefined`);
      }
    }
  }

  validate(schema as Record<string, unknown>);

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================
// EXPORT DEFAULT GENERATOR
// ============================================

export default {
  generate: generateMockData,
  generateArray: generateMockArray,
  generatePaginated: generatePaginatedResponse,
  validate: validateSchema,
  setLocale,
  setSeed,
  resetSeed,
};
