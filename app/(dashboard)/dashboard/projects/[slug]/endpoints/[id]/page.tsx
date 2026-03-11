import { notFound } from "next/navigation";
import { getServerSession } from "@/lib/auth-server";
import { getEndpoint } from "@/lib/db";
import { EndpointForm } from "@/components/endpoints/endpoint-form";
import { EndpointTabs } from "@/components/endpoints/endpoint-tabs";

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
        <h1 className="text-2xl font-bold text-zinc-100">Edit Endpoint</h1>
        <p className="text-zinc-400 mt-1">
          {endpoint.method} {endpoint.path}
        </p>
      </div>

      <EndpointTabs
        projectSlug={endpoint.project.slug}
        endpoint={endpoint}
      />
    </div>
  );
}
