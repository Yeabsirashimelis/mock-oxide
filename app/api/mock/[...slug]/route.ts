import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateMockData, generateMockArray, generatePaginatedResponse } from "@/lib/mock-generator";
import { HttpMethod, Prisma } from "@/app/generated/prisma/client";
import { SchemaDefinition } from "@/lib/types";

type JsonValue = Prisma.InputJsonValue;

// ============================================
// CORS HEADERS
// ============================================

function getCorsHeaders(origin?: string, allowedOrigins?: string[]): Record<string, string> {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key",
    "Access-Control-Max-Age": "86400",
  };

  // If no allowed origins specified, allow all
  if (!allowedOrigins || allowedOrigins.length === 0) {
    headers["Access-Control-Allow-Origin"] = "*";
  } else if (origin && allowedOrigins.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Vary"] = "Origin";
  }

  return headers;
}

// ============================================
// RESPONSE HELPERS
// ============================================

function jsonResponse(
  data: unknown,
  status: number = 200,
  headers: Record<string, string> = {}
): NextResponse {
  return NextResponse.json(data, {
    status,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });
}

function errorResponse(
  message: string,
  status: number = 404,
  headers: Record<string, string> = {}
): NextResponse {
  return jsonResponse(
    { error: message, status },
    status,
    headers
  );
}

// ============================================
// URL PARSING
// ============================================

interface ParsedUrl {
  projectSlug: string;
  endpointPath: string;
}

function parseSlug(slug: string[]): ParsedUrl | null {
  if (!slug || slug.length < 2) {
    return null;
  }

  // First segment is project slug, rest is the endpoint path
  const [projectSlug, ...pathParts] = slug;
  const endpointPath = "/" + pathParts.join("/");

  return { projectSlug, endpointPath };
}

// ============================================
// QUERY PARAM PARSING
// ============================================

interface QueryParams {
  page: number;
  limit: number;
  sort?: string;
  order?: "asc" | "desc";
  search?: string;
  filters: Record<string, string>;
  seed?: number;
}

function parseQueryParams(searchParams: URLSearchParams): QueryParams {
  const params: QueryParams = {
    page: parseInt(searchParams.get("page") || "1", 10),
    limit: parseInt(searchParams.get("limit") || "10", 10),
    filters: {},
  };

  // Clamp values
  params.page = Math.max(1, params.page);
  params.limit = Math.min(100, Math.max(1, params.limit));

  // Sort
  const sort = searchParams.get("sort");
  if (sort) {
    params.sort = sort;
    params.order = (searchParams.get("order") as "asc" | "desc") || "asc";
  }

  // Search
  const search = searchParams.get("q") || searchParams.get("search");
  if (search) {
    params.search = search;
  }

  // Seed for reproducible data
  const seed = searchParams.get("seed");
  if (seed) {
    params.seed = parseInt(seed, 10);
  }

  // Collect remaining params as filters
  searchParams.forEach((value, key) => {
    if (!["page", "limit", "sort", "order", "q", "search", "seed"].includes(key)) {
      params.filters[key] = value;
    }
  });

  return params;
}

// ============================================
// REQUEST LOGGING
// ============================================

async function logRequest(
  endpointId: string,
  method: string,
  path: string,
  req: NextRequest,
  statusCode: number,
  startTime: number,
  body?: unknown
) {
  try {
    const duration = Date.now() - startTime;
    const query = Object.fromEntries(req.nextUrl.searchParams);
    const headers = Object.fromEntries(req.headers);

    // Don't await - fire and forget for performance
    prisma.request.create({
      data: {
        endpointId,
        method,
        path,
        query: Object.keys(query).length > 0 ? query : undefined,
        headers: {
          "user-agent": headers["user-agent"],
          "content-type": headers["content-type"],
          origin: headers["origin"],
        },
        body: body && typeof body === "object" ? body : undefined,
        statusCode,
        duration,
        ip: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined,
        userAgent: req.headers.get("user-agent") || undefined,
      },
    }).catch(console.error);
  } catch (error) {
    console.error("Failed to log request:", error);
  }
}

// ============================================
// RATE LIMITING (Simple in-memory)
// ============================================

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(endpointId: string, limit: number | null, ip: string): boolean {
  if (!limit) return true;

  const key = `${endpointId}:${ip}`;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window

  const record = rateLimitMap.get(key);

  if (!record || record.resetAt < now) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count++;
  return true;
}

// ============================================
// RESPONSE SCENARIOS
// ============================================

interface Condition {
  type: "query" | "header";
  key: string;
  operator: "equals" | "contains" | "exists";
  value: string;
}

interface Scenario {
  name: string;
  conditions: Condition[];
  response: {
    statusCode: number;
    body: unknown;
    delay?: number;
  };
}

function checkScenarioConditions(
  scenario: Scenario,
  req: NextRequest
): boolean {
  return scenario.conditions.every((condition) => {
    let actualValue: string | null = null;

    if (condition.type === "query") {
      actualValue = req.nextUrl.searchParams.get(condition.key);
    } else if (condition.type === "header") {
      actualValue = req.headers.get(condition.key);
    }

    switch (condition.operator) {
      case "equals":
        return actualValue === condition.value;
      case "contains":
        return actualValue !== null && actualValue.includes(condition.value);
      case "exists":
        return actualValue !== null;
      default:
        return false;
    }
  });
}

function findMatchingScenario(
  scenarios: Scenario[] | null | undefined,
  req: NextRequest
): Scenario | null {
  if (!scenarios || !Array.isArray(scenarios) || scenarios.length === 0) {
    return null;
  }

  for (const scenario of scenarios) {
    if (checkScenarioConditions(scenario, req)) {
      return scenario;
    }
  }

  return null;
}

// ============================================
// STATEFUL DATA HANDLING
// ============================================

async function handleStatefulRequest(
  endpoint: {
    id: string;
    stateData: unknown;
    schema: unknown;
    arrayCount: number;
  },
  method: string,
  body?: unknown
): Promise<{ data: unknown; status: number }> {
  const schema = endpoint.schema as SchemaDefinition;
  let stateData = (endpoint.stateData as Record<string, unknown>[] | null) || [];

  switch (method) {
    case "GET": {
      return { data: stateData, status: 200 };
    }

    case "POST": {
      const mockData = generateMockData(schema) as Record<string, unknown>;
      const newItem = {
        id: crypto.randomUUID(),
        ...mockData,
        ...(typeof body === "object" && body !== null ? body : {}),
        createdAt: new Date().toISOString(),
      };
      stateData = [...stateData, newItem];

      await prisma.endpoint.update({
        where: { id: endpoint.id },
        data: { stateData: stateData as JsonValue },
      });

      return { data: newItem, status: 201 };
    }

    case "DELETE": {
      // Clear all state data
      await prisma.endpoint.update({
        where: { id: endpoint.id },
        data: { stateData: [] as JsonValue },
      });

      return { data: { message: "All records deleted" }, status: 200 };
    }

    default: {
      return { data: stateData, status: 200 };
    }
  }
}

async function handleStatefulItemRequest(
  endpoint: {
    id: string;
    stateData: unknown;
    schema: unknown;
  },
  method: string,
  itemId: string,
  body?: unknown
): Promise<{ data: unknown; status: number } | null> {
  let stateData = (endpoint.stateData as Record<string, unknown>[] | null) || [];
  const itemIndex = stateData.findIndex((item) => item.id === itemId);

  if (itemIndex === -1 && method !== "POST") {
    return null; // 404
  }

  switch (method) {
    case "GET": {
      return { data: stateData[itemIndex], status: 200 };
    }

    case "PUT":
    case "PATCH": {
      const updatedItem = {
        ...stateData[itemIndex],
        ...(typeof body === "object" && body !== null ? body : {}),
        updatedAt: new Date().toISOString(),
      };
      stateData[itemIndex] = updatedItem;

      await prisma.endpoint.update({
        where: { id: endpoint.id },
        data: { stateData: stateData as JsonValue },
      });

      return { data: updatedItem, status: 200 };
    }

    case "DELETE": {
      const deletedItem = stateData[itemIndex];
      stateData = stateData.filter((_, i) => i !== itemIndex);

      await prisma.endpoint.update({
        where: { id: endpoint.id },
        data: { stateData: stateData as JsonValue },
      });

      return { data: deletedItem, status: 200 };
    }

    default: {
      return { data: stateData[itemIndex], status: 200 };
    }
  }
}

// ============================================
// MAIN HANDLER
// ============================================

async function handleRequest(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
): Promise<NextResponse> {
  const startTime = Date.now();
  const { slug } = await params;
  const method = req.method as HttpMethod;
  const origin = req.headers.get("origin") || undefined;

  // Parse URL
  const parsed = parseSlug(slug);
  if (!parsed) {
    return errorResponse(
      "Invalid URL format. Expected: /api/mock/{project-slug}/{endpoint-path}",
      400,
      getCorsHeaders(origin)
    );
  }

  const { projectSlug, endpointPath } = parsed;

  try {
    // Find endpoint
    const endpoint = await prisma.endpoint.findFirst({
      where: {
        path: endpointPath,
        method,
        enabled: true,
        project: {
          slug: projectSlug,
        },
      },
      include: {
        project: {
          select: { id: true, slug: true, name: true },
        },
      },
    });

    if (!endpoint) {
      return errorResponse(
        `Endpoint not found: ${method} ${endpointPath}`,
        404,
        getCorsHeaders(origin)
      );
    }

    const corsHeaders = getCorsHeaders(origin, endpoint.corsOrigins);

    // Parse request body for POST/PUT/PATCH
    let body: unknown;
    if (["POST", "PUT", "PATCH"].includes(method)) {
      try {
        body = await req.json();
      } catch {
        // No body or invalid JSON - that's okay
      }
    }

    // Rate limiting
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    if (!checkRateLimit(endpoint.id, endpoint.rateLimit, ip)) {
      logRequest(endpoint.id, method, endpointPath, req, 429, startTime, body);
      return errorResponse(
        "Rate limit exceeded",
        429,
        { ...corsHeaders, "Retry-After": "60" }
      );
    }

    // API Key authentication
    if (endpoint.authRequired) {
      const apiKey = req.headers.get("x-api-key") || req.headers.get("authorization")?.replace("Bearer ", "");

      if (!apiKey) {
        logRequest(endpoint.id, method, endpointPath, req, 401, startTime, body);
        return errorResponse("API key required", 401, corsHeaders);
      }

      const validKey = await prisma.apiKey.findUnique({
        where: { key: apiKey },
      });

      if (!validKey || (validKey.expiresAt && validKey.expiresAt < new Date())) {
        logRequest(endpoint.id, method, endpointPath, req, 401, startTime, body);
        return errorResponse("Invalid or expired API key", 401, corsHeaders);
      }

      // Update usage
      prisma.apiKey.update({
        where: { id: validKey.id },
        data: { lastUsed: new Date(), usageCount: { increment: 1 } },
      }).catch(console.error);
    }

    // Check for matching scenario
    const matchingScenario = findMatchingScenario(
      endpoint.scenarios as Scenario[] | null,
      req
    );

    if (matchingScenario) {
      // Apply scenario-specific delay or endpoint delay
      const scenarioDelay = matchingScenario.response.delay ?? endpoint.delay;
      if (scenarioDelay > 0) {
        await new Promise((resolve) => setTimeout(resolve, scenarioDelay));
      }

      // Add custom response headers
      const responseHeaders: Record<string, string> = { ...corsHeaders };
      if (endpoint.responseHeaders && typeof endpoint.responseHeaders === "object") {
        Object.assign(responseHeaders, endpoint.responseHeaders);
      }

      // Log request
      logRequest(
        endpoint.id,
        method,
        endpointPath,
        req,
        matchingScenario.response.statusCode,
        startTime,
        body
      );

      return jsonResponse(
        matchingScenario.response.body,
        matchingScenario.response.statusCode,
        responseHeaders
      );
    }

    // Apply delay if configured
    if (endpoint.delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, endpoint.delay));
    }

    // Parse query params
    const queryParams = parseQueryParams(req.nextUrl.searchParams);
    const schema = endpoint.schema as SchemaDefinition;

    let responseData: unknown;
    let statusCode = endpoint.responseCode;

    // Handle stateful endpoints
    if (endpoint.stateful) {
      // Check if this is a request for a specific item (e.g., /users/123)
      const pathParts = endpointPath.split("/").filter(Boolean);
      const lastPart = pathParts[pathParts.length - 1];
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(lastPart);

      if (isUuid && pathParts.length > 1) {
        const result = await handleStatefulItemRequest(endpoint, method, lastPart, body);
        if (!result) {
          logRequest(endpoint.id, method, endpointPath, req, 404, startTime, body);
          return errorResponse("Item not found", 404, corsHeaders);
        }
        responseData = result.data;
        statusCode = result.status;
      } else {
        const result = await handleStatefulRequest(endpoint, method, body);
        responseData = result.data;
        statusCode = result.status;
      }
    } else {
      // Generate mock data
      const generatorOptions = queryParams.seed ? { seed: queryParams.seed } : undefined;

      if (endpoint.isArray) {
        if (endpoint.pagination) {
          const total = endpoint.arrayCount;
          responseData = generatePaginatedResponse(
            schema,
            { page: queryParams.page, limit: queryParams.limit, total },
            generatorOptions
          );
        } else {
          responseData = generateMockArray(schema, endpoint.arrayCount, generatorOptions);
        }
      } else {
        responseData = generateMockData(schema, generatorOptions);
      }
    }

    // Add custom response headers
    const responseHeaders: Record<string, string> = { ...corsHeaders };
    if (endpoint.responseHeaders && typeof endpoint.responseHeaders === "object") {
      Object.assign(responseHeaders, endpoint.responseHeaders);
    }

    // Log request
    logRequest(endpoint.id, method, endpointPath, req, statusCode, startTime, body);

    return jsonResponse(responseData, statusCode, responseHeaders);
  } catch (error) {
    console.error("Mock API error:", error);
    return errorResponse(
      "Internal server error",
      500,
      getCorsHeaders(origin)
    );
  }
}

// ============================================
// HTTP METHOD HANDLERS
// ============================================

export async function GET(req: NextRequest, context: { params: Promise<{ slug: string[] }> }) {
  return handleRequest(req, context);
}

export async function POST(req: NextRequest, context: { params: Promise<{ slug: string[] }> }) {
  return handleRequest(req, context);
}

export async function PUT(req: NextRequest, context: { params: Promise<{ slug: string[] }> }) {
  return handleRequest(req, context);
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ slug: string[] }> }) {
  return handleRequest(req, context);
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ slug: string[] }> }) {
  return handleRequest(req, context);
}

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin") || undefined;
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(origin),
  });
}
