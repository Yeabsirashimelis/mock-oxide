import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth-server";
import { generateSlug } from "@/lib/utils";

// POST /api/projects/import - Import project from JSON
export async function POST(request: Request) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { importData } = body;

    if (!importData || !importData.project) {
      return NextResponse.json(
        { error: "Invalid import data" },
        { status: 400 }
      );
    }

    const { project: importedProject } = importData;

    // Validate required fields
    if (!importedProject.name) {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      );
    }

    // Generate a unique slug (add suffix if original exists)
    let slug = importedProject.slug || generateSlug(importedProject.name);
    let slugSuffix = 1;

    while (await prisma.project.findUnique({ where: { slug } })) {
      slug = `${importedProject.slug || generateSlug(importedProject.name)}-${slugSuffix}`;
      slugSuffix++;
    }

    // Create the project with all endpoints
    const project = await prisma.project.create({
      data: {
        name: importedProject.name,
        slug,
        description: importedProject.description || null,
        userId: session.user.id,
        endpoints: {
          create: (importedProject.endpoints || []).map((endpoint: any) => ({
            name: endpoint.name || null,
            path: endpoint.path,
            method: endpoint.method || "GET",
            description: endpoint.description || null,
            schema: endpoint.schema,
            responseCode: endpoint.responseCode || 200,
            responseHeaders: endpoint.responseHeaders || null,
            delay: endpoint.delay || 0,
            isArray: endpoint.isArray || false,
            arrayCount: endpoint.arrayCount || 10,
            pagination: endpoint.pagination || false,
            stateful: endpoint.stateful || false,
            authRequired: endpoint.authRequired || false,
            rateLimit: endpoint.rateLimit || null,
            corsOrigins: endpoint.corsOrigins || [],
            enabled: endpoint.enabled ?? true,
          })),
        },
      },
      include: {
        endpoints: true,
      },
    });

    return NextResponse.json({
      success: true,
      project: {
        id: project.id,
        name: project.name,
        slug: project.slug,
        endpointsCount: project.endpoints.length,
      },
    });
  } catch (error) {
    console.error("Error importing project:", error);
    return NextResponse.json(
      { error: "Failed to import project" },
      { status: 500 }
    );
  }
}
