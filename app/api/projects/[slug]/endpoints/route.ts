import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-server";
import { createEndpoint } from "@/lib/db";
import prisma from "@/lib/prisma";
import { HttpMethod } from "@/app/generated/prisma/client";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;

    // Find project and verify ownership
    const project = await prisma.project.findUnique({
      where: { slug },
      select: { id: true, userId: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const {
      name,
      path,
      method,
      schema,
      description,
      responseCode,
      responseHeaders,
      scenarios,
      delay,
      isArray,
      arrayCount,
      pagination,
      stateful,
      authRequired,
      rateLimit,
      corsOrigins,
      validateRequest,
      enabled,
    } = body;

    if (!path || !schema) {
      return NextResponse.json(
        { error: "Path and schema are required" },
        { status: 400 }
      );
    }

    const endpoint = await createEndpoint(project.id, {
      name,
      path,
      method: method as HttpMethod,
      schema,
      description,
      responseCode,
      responseHeaders,
      scenarios,
      delay,
      isArray,
      arrayCount,
      pagination,
      stateful,
      authRequired,
      rateLimit,
      corsOrigins,
      validateRequest,
    });

    // Update enabled status if provided
    if (enabled !== undefined) {
      await prisma.endpoint.update({
        where: { id: endpoint.id },
        data: { enabled },
      });
    }

    return NextResponse.json(endpoint, { status: 201 });
  } catch (error) {
    console.error("Create endpoint error:", error);

    // Check for unique constraint violation
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json(
        { error: "An endpoint with this path and method already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create endpoint" },
      { status: 500 }
    );
  }
}
