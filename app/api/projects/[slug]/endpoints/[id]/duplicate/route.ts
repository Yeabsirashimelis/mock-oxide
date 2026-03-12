import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

// POST /api/projects/[slug]/endpoints/[id]/duplicate - Duplicate an endpoint
export async function POST(
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
          select: { id: true, userId: true, slug: true },
        },
      },
    });

    if (!endpoint) {
      return NextResponse.json({ error: "Endpoint not found" }, { status: 404 });
    }

    if (endpoint.project.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Generate unique path for duplicate
    let newPath = endpoint.path;
    let suffix = 1;

    // Check if path ends with -copy-N pattern
    const copyPattern = /-copy(-\d+)?$/;
    if (copyPattern.test(newPath)) {
      // Remove existing -copy suffix
      newPath = newPath.replace(copyPattern, "");
    }

    // Find unique path
    while (true) {
      const testPath = suffix === 1 ? `${newPath}-copy` : `${newPath}-copy-${suffix}`;

      const existing = await prisma.endpoint.findFirst({
        where: {
          projectId: endpoint.projectId,
          path: testPath,
          method: endpoint.method,
        },
      });

      if (!existing) {
        newPath = testPath;
        break;
      }
      suffix++;
    }

    // Create duplicate endpoint
    const duplicate = await prisma.endpoint.create({
      data: {
        name: endpoint.name ? `${endpoint.name} (Copy)` : null,
        path: newPath,
        method: endpoint.method,
        description: endpoint.description,
        schema: endpoint.schema as object,
        responseCode: endpoint.responseCode,
        responseHeaders: (endpoint.responseHeaders as object) ?? undefined,
        scenarios: (endpoint.scenarios as object) ?? undefined,
        delay: endpoint.delay,
        isArray: endpoint.isArray,
        arrayCount: endpoint.arrayCount,
        pagination: endpoint.pagination,
        stateful: endpoint.stateful,
        authRequired: endpoint.authRequired,
        rateLimit: endpoint.rateLimit,
        corsOrigins: endpoint.corsOrigins,
        enabled: endpoint.enabled,
        projectId: endpoint.projectId,
      },
    });

    return NextResponse.json({
      success: true,
      endpoint: {
        id: duplicate.id,
        path: duplicate.path,
      },
    });
  } catch (error) {
    console.error("Error duplicating endpoint:", error);
    return NextResponse.json(
      { error: "Failed to duplicate endpoint" },
      { status: 500 }
    );
  }
}
