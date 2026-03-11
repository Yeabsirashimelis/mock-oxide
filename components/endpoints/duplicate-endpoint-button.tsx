"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface DuplicateEndpointButtonProps {
  projectSlug: string;
  endpointId: string;
}

export function DuplicateEndpointButton({ projectSlug, endpointId }: DuplicateEndpointButtonProps) {
  const router = useRouter();
  const [isDuplicating, setIsDuplicating] = useState(false);

  const handleDuplicate = async () => {
    if (!confirm("Duplicate this endpoint? A copy will be created with '-copy' appended to the path.")) {
      return;
    }

    setIsDuplicating(true);

    try {
      const response = await fetch(`/api/projects/${projectSlug}/endpoints/${endpointId}/duplicate`, {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        // Redirect to the duplicated endpoint
        router.push(`/dashboard/projects/${projectSlug}/endpoints/${data.endpoint.id}`);
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to duplicate endpoint");
      }
    } catch (error) {
      alert("Failed to duplicate endpoint");
      console.error(error);
    } finally {
      setIsDuplicating(false);
    }
  };

  return (
    <button
      onClick={handleDuplicate}
      disabled={isDuplicating}
      className="px-4 py-2 border border-zinc-700 hover:border-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium text-zinc-300 transition-colors flex items-center gap-2"
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
        <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
      </svg>
      {isDuplicating ? "Duplicating..." : "Duplicate"}
    </button>
  );
}
