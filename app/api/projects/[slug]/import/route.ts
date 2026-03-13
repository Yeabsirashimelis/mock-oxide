import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-server";
import prisma from "@/lib/prisma";
import { validateAndParseOpenAPI, parseOpenAPISpec } from "@/lib/openapi-importer";

// POST /api/projects/[slug]/import - Import endpoints from OpenAPI spec
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
    const { content, skipExisting } = body;

    if (!content || typeof content !== "string") {
      return NextResponse.json(
        { error: "Invalid request: content is required" },
        { status: 400 }
      );
    }

    // Validate and parse OpenAPI spec
    const { spec, error: parseError } = validateAndParseOpenAPI(content);
    if (parseError || !spec) {
      return NextResponse.json(
        { error: parseError || "Failed to parse OpenAPI spec" },
        { status: 400 }
      );
    }

    // Convert to endpoints
    const { endpoints, errors } = parseOpenAPISpec(spec);

    if (errors.length > 0) {
      return NextResponse.json(
        {
          error: "Failed to parse some endpoints",
          details: errors,
        },
        { status: 400 }
      );
    }

    if (endpoints.length === 0) {
      return NextResponse.json(
        { error: "No valid endpoints found in OpenAPI spec" },
        { status: 400 }
      );
    }

    // Get existing endpoints to check for conflicts
    const existingEndpoints = await prisma.endpoint.findMany({
      where: { projectId: project.id },
      select: { path: true, method: true },
    });

    const existingKeys = new Set(
      existingEndpoints.map((e) => `${e.method}:${e.path}`)
    );

    // Filter out existing endpoints if skipExisting is true
    const endpointsToCreate = skipExisting
      ? endpoints.filter((e) => !existingKeys.has(`${e.method}:${e.path}`))
      : endpoints;

    if (endpointsToCreate.length === 0) {
      return NextResponse.json(
        {
          message: "All endpoints already exist",
          imported: 0,
          skipped: endpoints.length,
          total: endpoints.length,
        },
        { status: 200 }
      );
    }

    // Create endpoints
    const created = await prisma.endpoint.createMany({
      data: endpointsToCreate.map((endpoint) => ({
        ...endpoint,
        projectId: project.id,
        enabled: true,
      })),
      skipDuplicates: true,
    });

    return NextResponse.json({
      message: `Successfully imported ${created.count} endpoint(s)`,
      imported: created.count,
      skipped: endpoints.length - endpointsToCreate.length,
      total: endpoints.length,
      endpoints: endpointsToCreate.map((e) => ({
        method: e.method,
        path: e.path,
        name: e.name,
      })),
    });
  } catch (error) {
    console.error("Import OpenAPI error:", error);
    return NextResponse.json(
      {
        error: "Failed to import OpenAPI spec",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
