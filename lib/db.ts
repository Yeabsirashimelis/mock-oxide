import prisma from "./prisma";
import { HttpMethod } from "@/app/generated/prisma/client";

// ============================================
// PROJECT OPERATIONS
// ============================================

export async function createProject(
  userId: string,
  data: { name: string; slug: string; description?: string }
) {
  return prisma.project.create({
    data: {
      ...data,
      userId,
    },
    include: {
      endpoints: true,
    },
  });
}

export async function getProjectBySlug(slug: string) {
  return prisma.project.findUnique({
    where: { slug },
    include: {
      endpoints: {
        where: { enabled: true },
        orderBy: { createdAt: "asc" },
      },
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });
}

export async function getProjectsByUserId(userId: string) {
  return prisma.project.findMany({
    where: { userId },
    include: {
      _count: {
        select: { endpoints: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function updateProject(
  id: string,
  data: { name?: string; description?: string }
) {
  return prisma.project.update({
    where: { id },
    data,
  });
}

export async function deleteProject(id: string) {
  return prisma.project.delete({
    where: { id },
  });
}

// ============================================
// ENDPOINT OPERATIONS
// ============================================

export async function createEndpoint(
  projectId: string,
  data: {
    name?: string;
    path: string;
    method?: HttpMethod;
    schema: object;
    description?: string;
    responseCode?: number;
    delay?: number;
    isArray?: boolean;
    arrayCount?: number;
    pagination?: boolean;
    stateful?: boolean;
    authRequired?: boolean;
    rateLimit?: number;
  }
) {
  return prisma.endpoint.create({
    data: {
      ...data,
      schema: data.schema,
      projectId,
    },
  });
}

export async function getEndpoint(id: string) {
  return prisma.endpoint.findUnique({
    where: { id },
    include: {
      project: {
        select: { id: true, slug: true, name: true, userId: true },
      },
    },
  });
}

export async function getEndpointByPath(
  projectSlug: string,
  path: string,
  method: HttpMethod
) {
  return prisma.endpoint.findFirst({
    where: {
      path,
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
}

export async function updateEndpoint(
  id: string,
  data: {
    name?: string;
    path?: string;
    method?: HttpMethod;
    schema?: object;
    description?: string;
    responseCode?: number;
    delay?: number;
    isArray?: boolean;
    arrayCount?: number;
    pagination?: boolean;
    stateful?: boolean;
    stateData?: object;
    authRequired?: boolean;
    rateLimit?: number;
    enabled?: boolean;
  }
) {
  return prisma.endpoint.update({
    where: { id },
    data: {
      ...data,
      schema: data.schema,
      stateData: data.stateData,
    },
  });
}

export async function deleteEndpoint(id: string) {
  return prisma.endpoint.delete({
    where: { id },
  });
}

// ============================================
// REQUEST LOGGING
// ============================================

export async function logRequest(data: {
  endpointId: string;
  method: string;
  path: string;
  query?: object;
  headers?: object;
  body?: object;
  statusCode: number;
  duration: number;
  ip?: string;
  userAgent?: string;
}) {
  return prisma.request.create({
    data: {
      ...data,
      query: data.query,
      headers: data.headers,
      body: data.body,
    },
  });
}

export async function getRequestsByEndpoint(
  endpointId: string,
  options?: { limit?: number; offset?: number }
) {
  return prisma.request.findMany({
    where: { endpointId },
    orderBy: { createdAt: "desc" },
    take: options?.limit ?? 50,
    skip: options?.offset ?? 0,
  });
}

export async function getRequestStats(endpointId: string) {
  const [total, last24h, avgDuration] = await Promise.all([
    prisma.request.count({ where: { endpointId } }),
    prisma.request.count({
      where: {
        endpointId,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    }),
    prisma.request.aggregate({
      where: { endpointId },
      _avg: { duration: true },
    }),
  ]);

  return {
    total,
    last24h,
    avgDuration: avgDuration._avg.duration ?? 0,
  };
}

// ============================================
// API KEY OPERATIONS
// ============================================

export async function createApiKey(
  userId: string,
  data: { name: string; expiresAt?: Date }
) {
  const key = generateApiKey();
  return prisma.apiKey.create({
    data: {
      ...data,
      key,
      userId,
    },
  });
}

export async function getApiKeysByUserId(userId: string) {
  return prisma.apiKey.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function validateApiKey(key: string) {
  const apiKey = await prisma.apiKey.findUnique({
    where: { key },
    include: {
      user: {
        select: { id: true, email: true },
      },
    },
  });

  if (!apiKey) return null;

  // Check if expired
  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
    return null;
  }

  // Update usage stats
  await prisma.apiKey.update({
    where: { id: apiKey.id },
    data: {
      lastUsed: new Date(),
      usageCount: { increment: 1 },
    },
  });

  return apiKey;
}

export async function deleteApiKey(id: string) {
  return prisma.apiKey.delete({
    where: { id },
  });
}

// ============================================
// HELPERS
// ============================================

function generateApiKey(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const prefix = "mk_";
  let key = prefix;
  for (let i = 0; i < 32; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 50);
}
