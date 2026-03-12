"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface DeleteProjectButtonProps {
  projectId: string;
  projectSlug: string;
  variant?: "default" | "danger";
}

export function DeleteProjectButton({ projectId, projectSlug, variant = "default" }: DeleteProjectButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/projects/${projectSlug}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete project");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete project");
    } finally {
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  if (!showConfirm) {
    return (
      <button
        onClick={() => setShowConfirm(true)}
        className={
          variant === "danger"
            ? "px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            : "px-4 py-2 text-sm text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/40 rounded-lg transition-colors"
        }
      >
        Delete Project
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-zinc-400">Are you sure?</span>
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="px-3 py-1.5 text-sm text-white bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 rounded transition-colors"
      >
        {isDeleting ? "Deleting..." : "Yes, delete"}
      </button>
      <button
        onClick={() => setShowConfirm(false)}
        disabled={isDeleting}
        className="px-3 py-1.5 text-sm text-zinc-400 hover:text-zinc-100 border border-zinc-700 hover:border-zinc-600 rounded transition-colors"
      >
        Cancel
      </button>
    </div>
  );
}
