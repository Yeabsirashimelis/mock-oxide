import { HttpMethod } from "@/app/generated/prisma/client";

// ============================================
// SCHEMA TYPES
// ============================================

export type SchemaFieldType =
  | "uuid"
  | "string"
  | "number"
  | "integer"
  | "boolean"
  | "date"
  | "datetime"
  | "email"
  | "phone"
  | "url"
  | "avatar"
  | "firstName"
  | "lastName"
  | "fullName"
  | "address"
  | "city"
  | "country"
  | "zipCode"
  | "latitude"
  | "longitude"
  | "company"
  | "jobTitle"
  | "paragraph"
  | "sentence"
  | "word"
  | "color"
  | "hexColor"
  | "ip"
  | "ipv6"
  | "userAgent"
  | "creditCard";

export interface SchemaField {
  type: SchemaFieldType | string; // string for custom types like "enum:a,b,c"
  nullable?: boolean;
  description?: string;
}

export interface SchemaDefinition {
  [key: string]: SchemaField | SchemaFieldType | string | SchemaDefinition;
}

// ============================================
// API TYPES
// ============================================

export interface MockEndpointConfig {
  path: string;
  method: HttpMethod;
  schema: SchemaDefinition;
  responseCode?: number;
  responseHeaders?: Record<string, string>;
  delay?: number;
  isArray?: boolean;
  arrayCount?: number;
  pagination?: boolean;
  stateful?: boolean;
  authRequired?: boolean;
  rateLimit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface MockResponse {
  data: unknown;
  statusCode: number;
  headers: Record<string, string>;
}

// ============================================
// REQUEST TYPES
// ============================================

export interface IncomingMockRequest {
  method: string;
  path: string;
  query: Record<string, string | string[]>;
  headers: Record<string, string>;
  body?: unknown;
  ip?: string;
  userAgent?: string;
}

export interface RequestLog {
  id: string;
  method: string;
  path: string;
  query?: Record<string, unknown>;
  statusCode: number;
  duration: number;
  createdAt: Date;
}

// ============================================
// DASHBOARD TYPES
// ============================================

export interface ProjectStats {
  totalEndpoints: number;
  totalRequests: number;
  avgLatency: number;
  last24hRequests: number;
}

export interface EndpointStats {
  total: number;
  last24h: number;
  avgDuration: number;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}
