import { notFound } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "@/lib/auth-server";
import { getEndpoint } from "@/lib/db";
import { EndpointForm } from "@/components/endpoints/endpoint-form";
import { EndpointTabs } from "@/components/endpoints/endpoint-tabs";
import { DuplicateEndpointButton } from "@/components/endpoints/duplicate-endpoint-button";

interface EditEndpointPageProps {
  params: Promise<{ slug: string; id: string }>;
}

export default async function EditEndpointPage({ params }: EditEndpointPageProps) {
  const { slug, id } = await params;
  const session = await getServerSession();
  const endpoint = await getEndpoint(id);

  if (!endpoint || endpoint.project.userId !== session!.user.id) {
    notFound();
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-zinc-400 mb-2">
          <Link href="/dashboard" className="hover:text-zinc-100 transition-colors">
            Projects
          </Link>
          <span>/</span>
          <Link
            href={`/dashboard/projects/${endpoint.project.slug}`}
            className="hover:text-zinc-100 transition-colors"
          >
            {endpoint.project.name}
          </Link>
          <span>/</span>
          <span className="text-zinc-100">Edit Endpoint</span>
        </div>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">Edit Endpoint</h1>
            <p className="text-zinc-400 mt-1">
              {endpoint.method} {endpoint.path}
            </p>
          </div>
          <DuplicateEndpointButton
            projectSlug={endpoint.project.slug}
            endpointId={endpoint.id}
          />
        </div>
      </div>

      <EndpointTabs
        projectSlug={endpoint.project.slug}
        endpoint={endpoint}
      />
    </div>
  );
}
