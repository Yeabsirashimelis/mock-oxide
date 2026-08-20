"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** One-click seeding of a sample project for fresh accounts. */
export function CreateDemoButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/onboarding/demo", { method: "POST" });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create the demo project");
        return;
      }

      router.push(`/dashboard/projects/${data.slug}`);
      router.refresh();
    } catch {
      setError("Failed to create the demo project");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="inline-flex flex-col items-center gap-2">
      <button
        onClick={handleCreate}
        disabled={isLoading}
        className="inline-flex items-center gap-2 px-4 py-2 border border-zinc-700 hover:border-zinc-500 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-200 font-medium rounded-lg transition-colors"
      >
        {isLoading ? "Creating..." : "✦ Try a demo project"}
      </button>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
