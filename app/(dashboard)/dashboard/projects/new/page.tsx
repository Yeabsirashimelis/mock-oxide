import { ProjectForm } from "@/components/projects/project-form";

export default function NewProjectPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-100">Create Project</h1>
        <p className="text-zinc-400 mt-1">
          Create a new mock API project
        </p>
      </div>

      <ProjectForm mode="create" />
    </div>
  );
}
