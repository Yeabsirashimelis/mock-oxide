import { requireAuth } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { EndpointTester } from "@/components/endpoints/endpoint-tester";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ endpoint?: string }>;
}

export default async function ProjectTestPage({ params, searchParams }: PageProps) {
  const session = await requireAuth();
  const { slug } = await params;
  const { endpoint: endpointId } = await searchParams;

  const project = await prisma.project.findUnique({
    where: { slug, userId: session.user.id },
    include: {
      endpoints: {
        where: { enabled: true },
        select: {
          id: true,
          path: true,
          method: true,
          name: true,
          authRequired: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!project) {
    notFound();
  }

  const selectedEndpoint = endpointId
    ? project.endpoints.find((e) => e.id === endpointId)
    : project.endpoints[0];

  if (!selectedEndpoint && project.endpoints.length > 0) {
    notFound();
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-zinc-400 mb-2">
          <Link href="/dashboard" className="hover:text-zinc-100 transition-colors">
            Projects
          </Link>
          <span>/</span>
          <Link
            href={`/dashboard/projects/${project.slug}`}
            className="hover:text-zinc-100 transition-colors"
          >
            {project.name}
          </Link>
          <span>/</span>
          <span className="text-zinc-100">API Tester</span>
        </div>
        <h1 className="text-2xl font-bold text-zinc-100">API Tester</h1>
        <p className="text-sm text-zinc-400 mt-1">
          Test your mock API endpoints in real-time
        </p>
      </div>

      {project.endpoints.length === 0 ? (
        <div className="text-center py-16 bg-zinc-900 border border-zinc-800 rounded-lg">
          <div className="w-16 h-16 mx-auto mb-4 bg-zinc-800 rounded-full flex items-center justify-center">
            <span className="text-2xl text-zinc-600">&lt;/&gt;</span>
          </div>
          <h3 className="text-lg font-semibold text-zinc-300 mb-2">
            No enabled endpoints
          </h3>
          <p className="text-zinc-500 mb-6">
            Create and enable endpoints to start testing
          </p>
          <Link
            href={`/dashboard/projects/${project.slug}/endpoints/new`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium text-white transition-colors"
          >
            Create Endpoint
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Endpoint Selector */}
          <div className="lg:col-span-1">
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden sticky top-4">
              <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-950">
                <h3 className="text-sm font-medium text-zinc-300">Endpoints</h3>
              </div>
              <div className="divide-y divide-zinc-800 max-h-[calc(100vh-12rem)] overflow-y-auto">
                {project.endpoints.map((endpoint) => (
                  <Link
                    key={endpoint.id}
                    href={`/dashboard/projects/${project.slug}/test?endpoint=${endpoint.id}`}
                    className={`block px-4 py-3 hover:bg-zinc-950 transition-colors ${
                      selectedEndpoint?.id === endpoint.id ? "bg-zinc-950" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${
                          endpoint.method === "GET"
                            ? "text-green-400 bg-green-500/10"
                            : endpoint.method === "POST"
                            ? "text-blue-400 bg-blue-500/10"
                            : endpoint.method === "PUT"
                            ? "text-yellow-400 bg-yellow-500/10"
                            : endpoint.method === "PATCH"
                            ? "text-orange-400 bg-orange-500/10"
                            : "text-red-400 bg-red-500/10"
                        }`}
                      >
                        {endpoint.method}
                      </span>
                    </div>
                    <code className="text-xs font-mono text-zinc-300 block truncate">
                      {endpoint.path}
                    </code>
                    {endpoint.name && (
                      <p className="text-xs text-zinc-500 mt-1 truncate">
                        {endpoint.name}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Tester */}
          <div className="lg:col-span-3">
            {selectedEndpoint && (
              <EndpointTester
                projectSlug={project.slug}
                endpoint={{
                  path: selectedEndpoint.path,
                  method: selectedEndpoint.method,
                  authRequired: selectedEndpoint.authRequired,
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
