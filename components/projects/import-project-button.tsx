"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export function ImportProjectButton() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setError(null);

    try {
      // Read file content
      const content = await file.text();
      const importData = JSON.parse(content);

      // Validate basic structure
      if (!importData.project) {
        throw new Error("Invalid project file: missing project data");
      }

      // Send to import API
      const response = await fetch("/api/projects/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ importData }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to import project");
      }

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Redirect to the new project
      router.push(`/dashboard/projects/${data.project.slug}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import project");
      console.error(err);
    } finally {
      setIsImporting(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleFileSelect}
        className="hidden"
      />
      <button
        onClick={handleClick}
        disabled={isImporting}
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
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" x2="12" y1="3" y2="15" />
        </svg>
        {isImporting ? "Importing..." : "Import"}
      </button>
      {error && (
        <div className="absolute top-full left-0 mt-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg max-w-sm z-10">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
}
