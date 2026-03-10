import { notFound } from "next/navigation";
import { getServerSession } from "@/lib/auth-server";
import { getProjectBySlug } from "@/lib/db";
import { EndpointForm } from "@/components/endpoints/endpoint-form";

interface NewEndpointPageProps {
  params: Promise<{ slug: string }>;
}

export default async function NewEndpointPage({ params }: NewEndpointPageProps) {
  const { slug } = await params;
  const session = await getServerSession();
  const project = await getProjectBySlug(slug);

  if (!project || project.userId !== session!.user.id) {
    notFound();
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-100">Create Endpoint</h1>
        <p className="text-zinc-400 mt-1">
          Add a new endpoint to {project.name}
        </p>
      </div>

      <EndpointForm mode="create" projectSlug={project.slug} />
    </div>
  );
}
