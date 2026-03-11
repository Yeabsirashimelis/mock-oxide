import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-server";
import { updateEndpoint, deleteEndpoint } from "@/lib/db";
import prisma from "@/lib/prisma";
import { HttpMethod } from "@/app/generated/prisma/client";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Find endpoint and verify ownership
    const endpoint = await prisma.endpoint.findUnique({
      where: { id },
      include: {
        project: {
          select: { userId: true },
        },
      },
    });

    if (!endpoint) {
      return NextResponse.json({ error: "Endpoint not found" }, { status: 404 });
    }

    if (endpoint.project.userId !== session.user.id) {
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
      delay,
      isArray,
      arrayCount,
      pagination,
      stateful,
      authRequired,
      rateLimit,
      enabled,
    } = body;

    const updated = await updateEndpoint(id, {
      name,
      path,
      method: method as HttpMethod,
      schema,
      description,
      responseCode,
      responseHeaders,
      delay,
      isArray,
      arrayCount,
      pagination,
      stateful,
      authRequired,
      rateLimit,
      enabled,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update endpoint error:", error);
    return NextResponse.json(
      { error: "Failed to update endpoint" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Find endpoint and verify ownership
    const endpoint = await prisma.endpoint.findUnique({
      where: { id },
      include: {
        project: {
          select: { userId: true },
        },
      },
    });

    if (!endpoint) {
      return NextResponse.json({ error: "Endpoint not found" }, { status: 404 });
    }

    if (endpoint.project.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await deleteEndpoint(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete endpoint error:", error);
    return NextResponse.json(
      { error: "Failed to delete endpoint" },
      { status: 500 }
    );
  }
}
