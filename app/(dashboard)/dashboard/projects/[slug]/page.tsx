import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "@/lib/auth-server";
import { getProjectBySlug } from "@/lib/db";
import { DeleteProjectButton } from "@/components/projects/delete-project-button";
import { EndpointList } from "@/components/projects/endpoint-list";
import { CopyButton } from "@/components/ui/copy-button";
import { ExportProjectButton } from "@/components/projects/export-project-button";
import { ImportOpenAPIButton } from "@/components/projects/import-openapi-button";

interface ProjectPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const session = await getServerSession();
  const project = await getProjectBySlug(slug);

  if (!project || project.userId !== session!.user.id) {
    notFound();
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const apiUrl = `${baseUrl}/api/mock/${project.slug}`;

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              href="/dashboard"
              className="text-zinc-400 hover:text-zinc-100 transition-colors"
            >
              Projects
            </Link>
            <span className="text-zinc-600">/</span>
            <span className="text-zinc-100">{project.name}</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-100">{project.name}</h1>
          {project.description && (
            <p className="text-zinc-400 mt-1">{project.description}</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/projects/${project.slug}/test`}
            className="px-4 py-2 border border-zinc-700 hover:border-zinc-600 rounded-lg font-medium text-zinc-300 transition-colors flex items-center gap-2"
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
              <path d="m5 12 7-7 7 7"/>
              <path d="M12 19V5"/>
            </svg>
            Test API
          </Link>
          <Link
            href={`/dashboard/projects/${project.slug}/analytics`}
            className="px-4 py-2 border border-zinc-700 hover:border-zinc-600 rounded-lg font-medium text-zinc-300 transition-colors flex items-center gap-2"
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
              <path d="M3 3v18h18"/>
              <path d="m19 9-5 5-4-4-3 3"/>
            </svg>
            Analytics
          </Link>
          <ImportOpenAPIButton projectSlug={project.slug} />
          <Link
            href={`/dashboard/projects/${project.slug}/endpoints/new`}
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
            New Endpoint
          </Link>
          <ExportProjectButton projectSlug={project.slug} />
          <Link
            href={`/dashboard/projects/${project.slug}/settings`}
            className="px-4 py-2 text-zinc-400 hover:text-zinc-100 border border-zinc-700 hover:border-zinc-600 rounded-lg transition-colors flex items-center gap-2"
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
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            Settings
          </Link>
        </div>
      </div>

      {/* API URL & Documentation */}
      <div className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
          <p className="text-sm text-zinc-400 mb-2">Base URL</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-sm font-mono text-zinc-100 bg-zinc-950 px-3 py-2 rounded border border-zinc-800">
              {apiUrl}
            </code>
            <CopyButton text={apiUrl} />
          </div>
        </div>

        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
          <p className="text-sm text-zinc-400 mb-2">API Documentation</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-sm font-mono text-zinc-100 bg-zinc-950 px-3 py-2 rounded border border-zinc-800">
              {baseUrl}/docs/{project.slug}
            </code>
            <CopyButton text={`${baseUrl}/docs/${project.slug}`} />
            <Link
              href={`/docs/${project.slug}`}
              target="_blank"
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
            >
              View
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
          <p className="text-sm text-zinc-400 mb-1">Total Endpoints</p>
          <p className="text-2xl font-bold text-zinc-100">
            {project.endpoints.length}
          </p>
        </div>
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
          <p className="text-sm text-zinc-400 mb-1">Active Endpoints</p>
          <p className="text-2xl font-bold text-zinc-100">
            {project.endpoints.filter((e) => e.enabled).length}
          </p>
        </div>
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
          <p className="text-sm text-zinc-400 mb-1">Created</p>
          <p className="text-sm text-zinc-300">
            {new Date(project.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Endpoints */}
      <div>
        <h2 className="text-lg font-semibold text-zinc-100 mb-4">Endpoints</h2>
        {project.endpoints.length === 0 ? (
          <div className="text-center py-16 bg-zinc-900 border border-zinc-800 rounded-lg">
            <div className="w-16 h-16 mx-auto mb-4 bg-zinc-800 rounded-full flex items-center justify-center">
              <span className="text-2xl text-zinc-600">&lt;/&gt;</span>
            </div>
            <h3 className="text-lg font-semibold text-zinc-300 mb-2">
              No endpoints yet
            </h3>
            <p className="text-zinc-500 mb-6">
              Create your first endpoint to start serving mock data
            </p>
            <Link
              href={`/dashboard/projects/${project.slug}/endpoints/new`}
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
              Create Endpoint
            </Link>
          </div>
        ) : (
          <EndpointList endpoints={project.endpoints} projectSlug={project.slug} />
        )}
      </div>
    </div>
  );
}
