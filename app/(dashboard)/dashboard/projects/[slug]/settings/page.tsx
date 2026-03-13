import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "@/lib/auth-server";
import prisma from "@/lib/prisma";
import { ProjectSettingsForm } from "@/components/projects/project-settings-form";
import { GlobalHeadersForm } from "@/components/projects/global-headers-form";
import { DeleteProjectButton } from "@/components/projects/delete-project-button";
import { CopyButton } from "@/components/ui/copy-button";

interface SettingsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { slug } = await params;
  const session = await getServerSession();

  const project = await prisma.project.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      defaultHeaders: true,
      userId: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: { endpoints: true },
      },
    },
  });

  if (!project || project.userId !== session?.user.id) {
    notFound();
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const apiUrl = `${baseUrl}/api/mock/${project.slug}`;
  const docsUrl = `${baseUrl}/docs/${project.slug}`;

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-8">
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
          <span className="text-zinc-100">Settings</span>
        </div>
        <h1 className="text-2xl font-bold text-zinc-100">Project Settings</h1>
        <p className="text-zinc-400 mt-1">Manage your project configuration</p>
      </div>

      {/* General Settings */}
      <div className="space-y-8">
        <section className="p-6 bg-zinc-900 border border-zinc-800 rounded-lg">
          <h2 className="text-lg font-semibold text-zinc-100 mb-4">General</h2>
          <ProjectSettingsForm
            projectId={project.id}
            projectSlug={project.slug}
            initialData={{
              name: project.name,
              description: project.description || "",
            }}
          />
        </section>

        {/* Global Headers */}
        <section className="p-6 bg-zinc-900 border border-zinc-800 rounded-lg">
          <h2 className="text-lg font-semibold text-zinc-100 mb-4">Global Response Headers</h2>
          <GlobalHeadersForm
            projectSlug={project.slug}
            initialHeaders={(project.defaultHeaders as Record<string, string>) || {}}
          />
        </section>

        {/* Project Info */}
        <section className="p-6 bg-zinc-900 border border-zinc-800 rounded-lg">
          <h2 className="text-lg font-semibold text-zinc-100 mb-4">Project Info</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Project Slug</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-zinc-300 font-mono text-sm">
                  {project.slug}
                </code>
                <CopyButton text={project.slug} />
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                The slug is used in your API URLs and cannot be changed.
              </p>
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-1">Base API URL</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-zinc-300 font-mono text-sm truncate">
                  {apiUrl}
                </code>
                <CopyButton text={apiUrl} />
              </div>
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-1">Documentation URL</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-zinc-300 font-mono text-sm truncate">
                  {docsUrl}
                </code>
                <CopyButton text={docsUrl} />
                <Link
                  href={docsUrl}
                  target="_blank"
                  className="px-3 py-2 text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded transition-colors"
                >
                  View
                </Link>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-800 grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-zinc-500">Created:</span>
                <span className="ml-2 text-zinc-300">
                  {new Date(project.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-zinc-500">Last updated:</span>
                <span className="ml-2 text-zinc-300">
                  {new Date(project.updatedAt).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-zinc-500">Endpoints:</span>
                <span className="ml-2 text-zinc-300">{project._count.endpoints}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="p-6 bg-zinc-900 border border-red-500/20 rounded-lg">
          <h2 className="text-lg font-semibold text-red-400 mb-2">Danger Zone</h2>
          <p className="text-sm text-zinc-400 mb-4">
            Once you delete a project, there is no going back. All endpoints and request logs will
            be permanently deleted.
          </p>
          <DeleteProjectButton
            projectId={project.id}
            projectSlug={project.slug}
            variant="danger"
          />
        </section>
      </div>
    </div>
  );
}
