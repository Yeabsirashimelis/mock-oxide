import { createMcpHandler, withMcpAuth } from "mcp-handler";
import { z } from "zod";
import { validateApiKey } from "@/lib/db";
import {
  createProjectForUser,
  listProjectsForUser,
} from "@/lib/services/projects";
import {
  createEndpointForUser,
  listEndpointsForUser,
} from "@/lib/services/endpoints";
import { ServiceError } from "@/lib/services/errors";
import { generateSlug } from "@/lib/utils";
import { HttpMethod } from "@/app/generated/prisma/client";

const BASE_URL = process.env.BETTER_AUTH_URL || "http://localhost:3000";

const SCHEMA_GUIDE = `Schema: an object mapping field names to type strings.
Types: uuid, string, sentence, paragraph, integer, number, price, boolean, date, datetime,
firstName, lastName, fullName, username, email, phone, avatar, bio, url, imageUrl, ip,
address, city, country, zipCode, latitude, longitude, productName, productDescription,
category, company, jobTitle, creditCard, currency, color, slug.
Constrained: "integer:18-65", "number:0-100", "enum:red,green,blue", "regex:[A-Z]{3}-[0-9]{4}".
Arrays: "array:email:5" (5 emails), "string[]". Nullable: "email?".
Nested objects work: {"author": {"name": "fullName", "email": "email"}}.
Example: {"id": "uuid", "name": "fullName", "age": "integer:18-65", "role": "enum:admin,user"}`;

function mockUrl(projectSlug: string, path = ""): string {
  return `${BASE_URL}/api/mock/${projectSlug}${path}`;
}

function jsonResult(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

function errorResult(message: string) {
  return {
    content: [{ type: "text" as const, text: message }],
    isError: true,
  };
}

/** Extracts the userId that withMcpAuth attached to the request's AuthInfo. */
function requireUserId(ctx: {
  http?: { authInfo?: { extra?: Record<string, unknown> } };
}): string {
  const userId = ctx.http?.authInfo?.extra?.userId;
  if (typeof userId !== "string") {
    throw new ServiceError("Not authenticated", 401, "UNAUTHENTICATED");
  }
  return userId;
}

/** Runs a tool body and converts thrown ServiceErrors into MCP error results. */
async function run(body: () => Promise<{ content: { type: "text"; text: string }[] }>) {
  try {
    return await body();
  } catch (error) {
    if (error instanceof ServiceError) {
      return errorResult(`${error.code}: ${error.message}`);
    }
    console.error("MCP tool error:", error);
    return errorResult("Internal error");
  }
}

const handler = createMcpHandler(
  (server) => {
    server.registerTool(
      "list_projects",
      {
        title: "List projects",
        description:
          "Lists the authenticated user's mock API projects with their slugs, endpoint counts and base URLs.",
      },
      async (ctx) =>
        run(async () => {
          const userId = requireUserId(ctx);
          const projects = await listProjectsForUser(userId);
          return jsonResult(
            projects.map((p) => ({
              name: p.name,
              slug: p.slug,
              description: p.description,
              endpoints: p._count.endpoints,
              baseUrl: mockUrl(p.slug),
            }))
          );
        })
    );

    server.registerTool(
      "create_project",
      {
        title: "Create project",
        description:
          "Creates a mock API project. A project groups endpoints under one base URL: {baseUrl}/api/mock/{slug}. If slug is omitted it is derived from the name.",
        inputSchema: z.object({
          name: z.string().describe("Human-readable project name"),
          slug: z
            .string()
            .regex(/^[a-z0-9-]+$/)
            .optional()
            .describe("URL slug (lowercase letters, numbers, hyphens). Derived from name if omitted"),
          description: z.string().optional(),
        }),
      },
      async ({ name, slug, description }, ctx) =>
        run(async () => {
          const userId = requireUserId(ctx);
          const project = await createProjectForUser(userId, {
            name,
            slug: slug || generateSlug(name),
            description,
          });
          return jsonResult({
            name: project.name,
            slug: project.slug,
            baseUrl: mockUrl(project.slug),
            docsUrl: `${BASE_URL}/docs/${project.slug}`,
          });
        })
    );

    server.registerTool(
      "list_endpoints",
      {
        title: "List endpoints",
        description:
          "Lists all endpoints of a project, including their live mock URLs and configuration.",
        inputSchema: z.object({
          project_slug: z.string().describe("Slug of the project"),
        }),
      },
      async ({ project_slug }, ctx) =>
        run(async () => {
          const userId = requireUserId(ctx);
          const endpoints = await listEndpointsForUser(userId, project_slug);
          return jsonResult(
            endpoints.map((e) => ({
              method: e.method,
              path: e.path,
              url: mockUrl(project_slug, e.path),
              name: e.name,
              enabled: e.enabled,
              isArray: e.isArray,
              arrayCount: e.isArray ? e.arrayCount : undefined,
              pagination: e.pagination || undefined,
              statusCode: e.responseCode,
              schema: e.schema,
            }))
          );
        })
    );

    server.registerTool(
      "create_endpoint",
      {
        title: "Create endpoint",
        description:
          `Creates a mock endpoint that immediately serves realistic generated data at {baseUrl}/api/mock/{project_slug}{path}. ` +
          `Paths may declare parameters (/users/:id) — a request like /users/123 then returns a stable object whose matching schema field echoes "123". ` +
          SCHEMA_GUIDE,
        inputSchema: z.object({
          project_slug: z.string().describe("Slug of the project to add the endpoint to"),
          path: z.string().describe('Endpoint path starting with "/", e.g. /products or /products/:id'),
          method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]).default("GET"),
          schema: z
            .record(z.string(), z.unknown())
            .describe("Response shape — field names mapped to type strings (see tool description)"),
          name: z.string().optional().describe("Display name, e.g. 'List products'"),
          description: z.string().optional(),
          is_array: z.boolean().default(false).describe("Return an array of objects instead of one object"),
          array_count: z.number().int().min(1).max(100).default(10).describe("Items per array response"),
          pagination: z.boolean().default(false).describe("Wrap array in {data, meta} with page/limit query params"),
          response_code: z.number().int().min(200).max(599).default(200),
          delay_ms: z.number().int().min(0).max(10000).default(0).describe("Simulated latency in milliseconds"),
          auth_required: z.boolean().default(false).describe("Require an x-api-key header on mock requests"),
          validate_request: z.boolean().default(false).describe("Validate POST/PUT/PATCH bodies against the schema (400 on mismatch)"),
        }),
      },
      async (input, ctx) =>
        run(async () => {
          const userId = requireUserId(ctx);
          const endpoint = await createEndpointForUser(userId, input.project_slug, {
            name: input.name,
            path: input.path,
            method: input.method as HttpMethod,
            schema: input.schema as object,
            description: input.description,
            responseCode: input.response_code,
            delay: input.delay_ms,
            isArray: input.is_array,
            arrayCount: input.array_count,
            pagination: input.pagination,
            authRequired: input.auth_required,
            validateRequest: input.validate_request,
            enabled: true,
          });
          return jsonResult({
            method: endpoint.method,
            path: endpoint.path,
            url: mockUrl(input.project_slug, endpoint.path),
            message: "Endpoint is live — request the URL to get generated data.",
          });
        })
    );

    server.registerTool(
      "get_mock_url",
      {
        title: "Get mock URL",
        description:
          "Returns the live base URL for a project (or a full URL when path is given) to wire into frontend code.",
        inputSchema: z.object({
          project_slug: z.string(),
          path: z.string().optional().describe('Optional endpoint path, e.g. "/products"'),
        }),
      },
      async ({ project_slug, path }, ctx) =>
        run(async () => {
          requireUserId(ctx);
          return jsonResult({ url: mockUrl(project_slug, path || "") });
        })
    );
  },
  {
    serverInfo: { name: "mock-oxide", version: "1.0.0" },
    instructions:
      "Mock Oxide hosts mock REST APIs. Typical flow: create_project, then create_endpoint for each " +
      "resource the frontend needs (inspect the frontend code to derive field names and types), then wire " +
      "the returned URLs into the frontend. Endpoints serve immediately — no deploy step.",
  }
);

/**
 * API-key auth: clients send their Mock Oxide key (mk_...) either as
 * `Authorization: Bearer mk_...` or an `x-api-key` header. The verified
 * user's id rides on AuthInfo.extra for the tool callbacks.
 */
const verifyApiKey = async (req: Request, bearerToken?: string) => {
  const key = bearerToken || req.headers.get("x-api-key");
  if (!key) return undefined;

  const apiKey = await validateApiKey(key);
  if (!apiKey) return undefined;

  return {
    token: key,
    clientId: apiKey.userId,
    scopes: [],
    extra: { userId: apiKey.userId },
  };
};

const authedHandler = withMcpAuth(handler, verifyApiKey, { required: true });

export {
  authedHandler as GET,
  authedHandler as POST,
  authedHandler as DELETE,
};
