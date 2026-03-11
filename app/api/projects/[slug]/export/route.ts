import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth-server";

// GET /api/projects/[slug]/export - Export project configuration
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;

    const project = await prisma.project.findUnique({
      where: { slug, userId: session.user.id },
      include: {
        endpoints: {
          select: {
            name: true,
            path: true,
            method: true,
            description: true,
            schema: true,
            responseCode: true,
            responseHeaders: true,
            delay: true,
            isArray: true,
            arrayCount: true,
            pagination: true,
            stateful: true,
            authRequired: true,
            rateLimit: true,
            corsOrigins: true,
            enabled: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Create export data
    const exportData = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      project: {
        name: project.name,
        slug: project.slug,
        description: project.description,
        endpoints: project.endpoints,
      },
    };

    // Return as downloadable JSON
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${project.slug}-export.json"`,
      },
    });
  } catch (error) {
    console.error("Error exporting project:", error);
    return NextResponse.json(
      { error: "Failed to export project" },
      { status: 500 }
    );
  }
}
