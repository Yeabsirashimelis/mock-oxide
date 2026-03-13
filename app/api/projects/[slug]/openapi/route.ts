import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateOpenAPISpec } from "@/lib/openapi-generator";

// GET /api/projects/[slug]/openapi - Generate OpenAPI spec
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const format = req.nextUrl.searchParams.get("format") || "json";

    // Find project with endpoints
    const project = await prisma.project.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        endpoints: {
          where: { enabled: true },
          select: {
            id: true,
            name: true,
            path: true,
            method: true,
            description: true,
            schema: true,
            responseCode: true,
            responseHeaders: true,
            isArray: true,
            arrayCount: true,
            pagination: true,
            authRequired: true,
            delay: true,
          },
          orderBy: { path: "asc" },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Generate OpenAPI spec
    const spec = generateOpenAPISpec(
      project.name,
      project.description,
      project.slug,
      project.endpoints
    );

    // Return as JSON or YAML
    if (format === "yaml") {
      // Simple YAML conversion (for basic needs)
      const yaml = jsonToYaml(spec);
      return new NextResponse(yaml, {
        headers: {
          "Content-Type": "application/x-yaml",
          "Content-Disposition": `attachment; filename="${project.slug}-openapi.yaml"`,
        },
      });
    }

    // Return JSON
    return NextResponse.json(spec, {
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Generate OpenAPI error:", error);
    return NextResponse.json(
      { error: "Failed to generate OpenAPI spec" },
      { status: 500 }
    );
  }
}

/**
 * Simple JSON to YAML converter
 */
function jsonToYaml(obj: any, indent = 0): string {
  const spaces = "  ".repeat(indent);
  let yaml = "";

  if (Array.isArray(obj)) {
    for (const item of obj) {
      if (typeof item === "object" && item !== null) {
        yaml += `${spaces}-\n${jsonToYaml(item, indent + 1)}`;
      } else {
        yaml += `${spaces}- ${JSON.stringify(item)}\n`;
      }
    }
  } else if (typeof obj === "object" && obj !== null) {
    for (const [key, value] of Object.entries(obj)) {
      if (value === null || value === undefined) {
        continue;
      }

      if (Array.isArray(value)) {
        yaml += `${spaces}${key}:\n`;
        yaml += jsonToYaml(value, indent + 1);
      } else if (typeof value === "object") {
        yaml += `${spaces}${key}:\n`;
        yaml += jsonToYaml(value, indent + 1);
      } else if (typeof value === "string") {
        // Escape quotes and handle multiline
        const escaped = value.includes("\n")
          ? `|\n${spaces}  ${value.split("\n").join(`\n${spaces}  `)}`
          : value.includes('"') || value.includes("'")
          ? `"${value.replace(/"/g, '\\"')}"`
          : value;
        yaml += `${spaces}${key}: ${escaped}\n`;
      } else {
        yaml += `${spaces}${key}: ${value}\n`;
      }
    }
  }

  return yaml;
}
