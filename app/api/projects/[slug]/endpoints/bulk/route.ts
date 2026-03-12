import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-server";
import prisma from "@/lib/prisma";

// PATCH /api/projects/[slug]/endpoints/bulk - Bulk enable/disable endpoints
export async function PATCH(
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
    const { ids, action } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "No endpoint IDs provided" },
        { status: 400 }
      );
    }

    if (!action || !["enable", "disable"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Use 'enable' or 'disable'" },
        { status: 400 }
      );
    }

    // Verify all endpoints belong to this project
    const endpoints = await prisma.endpoint.findMany({
      where: {
        id: { in: ids },
        projectId: project.id,
      },
      select: { id: true },
    });

    if (endpoints.length !== ids.length) {
      return NextResponse.json(
        { error: "Some endpoints were not found or don't belong to this project" },
        { status: 400 }
      );
    }

    // Update all endpoints
    await prisma.endpoint.updateMany({
      where: {
        id: { in: ids },
        projectId: project.id,
      },
      data: {
        enabled: action === "enable",
      },
    });

    return NextResponse.json({
      success: true,
      updated: ids.length,
      action,
    });
  } catch (error) {
    console.error("Bulk update error:", error);
    return NextResponse.json(
      { error: "Failed to update endpoints" },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[slug]/endpoints/bulk - Bulk delete endpoints
export async function DELETE(
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
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "No endpoint IDs provided" },
        { status: 400 }
      );
    }

    // Verify all endpoints belong to this project
    const endpoints = await prisma.endpoint.findMany({
      where: {
        id: { in: ids },
        projectId: project.id,
      },
      select: { id: true },
    });

    if (endpoints.length !== ids.length) {
      return NextResponse.json(
        { error: "Some endpoints were not found or don't belong to this project" },
        { status: 400 }
      );
    }

    // Delete all endpoints
    await prisma.endpoint.deleteMany({
      where: {
        id: { in: ids },
        projectId: project.id,
      },
    });

    return NextResponse.json({
      success: true,
      deleted: ids.length,
    });
  } catch (error) {
    console.error("Bulk delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete endpoints" },
      { status: 500 }
    );
  }
}
