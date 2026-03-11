import { requireAuth } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { AnalyticsStats } from "@/components/analytics/analytics-stats";
import { RequestsTable } from "@/components/analytics/requests-table";
import { StatusCodeChart } from "@/components/analytics/status-code-chart";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProjectAnalyticsPage({ params }: PageProps) {
  const session = await requireAuth();
  const { slug } = await params;

  const project = await prisma.project.findUnique({
    where: { slug, userId: session.user.id },
    include: {
      endpoints: {
        select: {
          id: true,
          path: true,
          method: true,
          name: true,
        },
      },
    },
  });

  if (!project) {
    notFound();
  }

  // Get analytics data
  const endpointIds = project.endpoints.map((e) => e.id);

  const requests = await prisma.request.findMany({
    where: {
      endpointId: { in: endpointIds },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      endpoint: {
        select: {
          path: true,
          method: true,
          name: true,
        },
      },
    },
  });

  // Calculate stats
  const totalRequests = await prisma.request.count({
    where: { endpointId: { in: endpointIds } },
  });

  const avgDuration =
    requests.length > 0
      ? Math.round(
          requests.reduce((sum, r) => sum + r.duration, 0) / requests.length
        )
      : 0;

  const statusCodes = requests.reduce((acc, r) => {
    acc[r.statusCode] = (acc[r.statusCode] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  // Get requests in last 24 hours
  const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentRequests = await prisma.request.count({
    where: {
      endpointId: { in: endpointIds },
      createdAt: { gte: last24Hours },
    },
  });

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
          <span className="text-zinc-100">Analytics</span>
        </div>
        <h1 className="text-2xl font-bold text-zinc-100">Analytics</h1>
        <p className="text-sm text-zinc-400 mt-1">
          Request statistics and usage metrics for {project.name}
        </p>
      </div>

      {/* Stats Overview */}
      <AnalyticsStats
        totalRequests={totalRequests}
        recentRequests={recentRequests}
        avgDuration={avgDuration}
        totalEndpoints={project.endpoints.length}
      />

      {/* Status Code Breakdown */}
      <div className="mt-6">
        <StatusCodeChart statusCodes={statusCodes} />
      </div>

      {/* Recent Requests */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold text-zinc-100 mb-4">Recent Requests</h2>
        <RequestsTable requests={requests} />
      </div>
    </div>
  );
}
