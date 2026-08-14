import prisma from "@/lib/prisma";
import { createEndpoint } from "@/lib/db";
import { HttpMethod } from "@/app/generated/prisma/client";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "./errors";
import { isUniqueConstraintError } from "./prisma";

export interface CreateEndpointInput {
  name?: string;
  path?: string;
  method?: HttpMethod;
  schema?: object;
  description?: string;
  responseCode?: number;
  responseHeaders?: object | null;
  scenarios?: object | null;
  delay?: number;
  isArray?: boolean;
  arrayCount?: number;
  pagination?: boolean;
  stateful?: boolean;
  authRequired?: boolean;
  rateLimit?: number;
  corsOrigins?: string[];
  validateRequest?: boolean;
  enabled?: boolean;
}

/**
 * Creates an endpoint under the project identified by `slug`, verifying that
 * `userId` owns it. Resolves the project, authorizes, validates required
 * fields and maps a duplicate path+method to a ConflictError. Callable from
 * any transport (web route, MCP server) since it takes a userId + slug rather
 * than reading a session.
 */
export async function createEndpointForUser(
  userId: string,
  slug: string,
  input: CreateEndpointInput
) {
  const project = await prisma.project.findUnique({
    where: { slug },
    select: { id: true, userId: true },
  });

  if (!project) {
    throw new NotFoundError("Project not found");
  }

  if (project.userId !== userId) {
    throw new ForbiddenError();
  }

  if (!input.path || !input.schema) {
    throw new ValidationError("Path and schema are required");
  }

  try {
    return await createEndpoint(project.id, {
      name: input.name,
      path: input.path,
      method: input.method,
      schema: input.schema,
      description: input.description,
      responseCode: input.responseCode,
      responseHeaders: input.responseHeaders,
      scenarios: input.scenarios,
      delay: input.delay,
      isArray: input.isArray,
      arrayCount: input.arrayCount,
      pagination: input.pagination,
      stateful: input.stateful,
      authRequired: input.authRequired,
      rateLimit: input.rateLimit,
      corsOrigins: input.corsOrigins,
      validateRequest: input.validateRequest,
      enabled: input.enabled,
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new ConflictError(
        "An endpoint with this path and method already exists"
      );
    }
    throw error;
  }
}
