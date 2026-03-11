import Link from "next/link";
import { getServerSession } from "@/lib/auth-server";
import { getProjectsByUserId } from "@/lib/db";
import { ImportProjectButton } from "@/components/projects/import-project-button";

type ProjectWithCount = Awaited<ReturnType<typeof getProjectsByUserId>>[number];

export default async function DashboardPage() {
  const session = await getServerSession();
  const projects: ProjectWithCount[] = await getProjectsByUserId(session!.user.id);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Projects</h1>
          <p className="text-zinc-400 mt-1">
            Manage your mock API projects
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ImportProjectButton />
          <Link
            href="/dashboard/projects/new"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium text-white transition-colors flex items-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            New Project
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-lg">
          <p className="text-sm text-zinc-400 mb-1">Total Projects</p>
          <p className="text-3xl font-bold text-zinc-100">{projects.length}</p>
        </div>
        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-lg">
          <p className="text-sm text-zinc-400 mb-1">Total Endpoints</p>
          <p className="text-3xl font-bold text-zinc-100">
            {projects.reduce((acc: number, p: typeof projects[0]) => acc + p._count.endpoints, 0)}
          </p>
        </div>
        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-lg">
          <p className="text-sm text-zinc-400 mb-1">Base URL</p>
          <p className="text-sm font-mono text-zinc-300 truncate">
            {process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/mock/
          </p>
        </div>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="text-center py-16 bg-zinc-900 border border-zinc-800 rounded-lg">
          <div className="w-16 h-16 mx-auto mb-4 bg-zinc-800 rounded-full flex items-center justify-center">
            <span className="text-2xl text-zinc-600">{"{ }"}</span>
          </div>
          <h3 className="text-lg font-semibold text-zinc-300 mb-2">
            No projects yet
          </h3>
          <p className="text-zinc-500 mb-6">
            Create your first project to start building mock APIs
          </p>
          <Link
            href="/dashboard/projects/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium text-white transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            Create Project
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/dashboard/projects/${project.slug}`}
              className="p-6 bg-zinc-900 border border-zinc-800 rounded-lg hover:border-zinc-700 transition-colors group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <span className="text-blue-400 font-mono">{"{ }"}</span>
                </div>
                <span className="text-xs text-zinc-500">
                  {project._count.endpoints} endpoints
                </span>
              </div>
              <h3 className="text-lg font-semibold text-zinc-100 group-hover:text-blue-400 transition-colors">
                {project.name}
              </h3>
              <p className="text-sm text-zinc-500 mt-1 truncate">
                /api/mock/{project.slug}/...
              </p>
              {project.description && (
                <p className="text-sm text-zinc-400 mt-3 line-clamp-2">
                  {project.description}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
