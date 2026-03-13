import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { DocsHeader } from "@/components/docs/docs-header";
import { DocsEndpoint } from "@/components/docs/docs-endpoint";
import { DocsNavigation } from "@/components/docs/docs-navigation";
import type { Metadata } from "next";

interface DocsPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: DocsPageProps): Promise<Metadata> {
  const { slug } = await params;

  const project = await prisma.project.findUnique({
    where: { slug },
    select: { name: true, description: true },
  });

  if (!project) {
    return {
      title: "API Documentation Not Found",
    };
  }

  return {
    title: `${project.name} API Documentation`,
    description: project.description || `API documentation for ${project.name}. Mock data endpoints for testing and development.`,
  };
}

export default async function ProjectDocsPage({ params }: DocsPageProps) {
  const { slug } = await params;

  const project = await prisma.project.findUnique({
    where: { slug },
    include: {
      endpoints: {
        where: { enabled: true },
        orderBy: [{ method: "asc" }, { path: "asc" }],
      },
    },
  });

  if (!project) {
    notFound();
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const apiBaseUrl = `${baseUrl}/api/mock/${project.slug}`;

  // Group endpoints by path for better organization
  const endpointsByPath = project.endpoints.reduce((acc, endpoint) => {
    const pathSegments = endpoint.path.split("/").filter(Boolean);
    const category = pathSegments[0] || "root";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(endpoint);
    return acc;
  }, {} as Record<string, typeof project.endpoints>);

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <DocsHeader project={project} apiBaseUrl={apiBaseUrl} />

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Introduction */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-zinc-100 mb-4">Introduction</h2>
              <p className="text-zinc-400 mb-4">
                {project.description ||
                  `Welcome to the ${project.name} API documentation. This API provides mock data endpoints for testing and development.`}
              </p>
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 mb-4">
                <p className="text-sm text-zinc-400 mb-2">Base URL:</p>
                <code className="text-sm font-mono text-blue-400">{apiBaseUrl}</code>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <p className="text-sm text-blue-300">
                  <strong>OpenAPI 3.0 Compatible:</strong> This documentation is auto-generated from an OpenAPI specification. Export the spec using the JSON/YAML buttons above to import into tools like Postman, Insomnia, or Swagger Editor.
                </p>
              </div>
            </section>

            {/* Authentication */}
            {project.endpoints.some((e) => e.authRequired) && (
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-zinc-100 mb-4">Authentication</h2>
                <p className="text-zinc-400 mb-4">
                  Some endpoints require authentication. Include your API key in the request headers:
                </p>
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                  <code className="text-sm font-mono text-zinc-300">
                    X-API-Key: your_api_key_here
                  </code>
                </div>
              </section>
            )}

            {/* Endpoints */}
            <section>
              <h2 className="text-2xl font-bold text-zinc-100 mb-6">Endpoints</h2>

              {Object.keys(endpointsByPath).length === 0 ? (
                <div className="text-center py-12 bg-zinc-900 border border-zinc-800 rounded-lg">
                  <p className="text-zinc-400">No endpoints available</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {Object.entries(endpointsByPath).map(([category, endpoints]) => (
                    <div key={category}>
                      <h3 className="text-lg font-semibold text-zinc-200 mb-4 capitalize">
                        {category === "root" ? "Root" : `/${category}`}
                      </h3>
                      <div className="space-y-6">
                        {endpoints.map((endpoint) => (
                          <DocsEndpoint
                            key={endpoint.id}
                            endpoint={endpoint}
                            projectSlug={project.slug}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Navigation Sidebar */}
          <div className="hidden lg:block lg:col-span-1">
            <DocsNavigation endpoints={project.endpoints} />
          </div>
        </div>
      </div>
    </div>
  );
}
