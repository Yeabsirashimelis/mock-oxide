"use client";

import { useState, useEffect } from "react";
import { generateMockData, generateMockArray } from "@/lib/mock-generator";

interface LivePreviewProps {
  schema: string;
  isArray: boolean;
  arrayCount: number;
}

export function LivePreview({ schema, isArray, arrayCount }: LivePreviewProps) {
  const [preview, setPreview] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const parsedSchema = JSON.parse(schema);
      const mockData = isArray
        ? generateMockArray(parsedSchema, Math.min(arrayCount, 3))
        : generateMockData(parsedSchema);

      setPreview(JSON.stringify(mockData, null, 2));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid JSON");
      setPreview("");
    }
  }, [schema, isArray, arrayCount]);

  const handleRefresh = () => {
    try {
      const parsedSchema = JSON.parse(schema);
      const mockData = isArray
        ? generateMockArray(parsedSchema, Math.min(arrayCount, 3))
        : generateMockData(parsedSchema);

      setPreview(JSON.stringify(mockData, null, 2));
    } catch (err) {
      // Error already handled in useEffect
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-900/50">
        <span className="text-sm font-medium text-zinc-300">Live Preview</span>
        <button
          type="button"
          onClick={handleRefresh}
          className="text-xs text-zinc-400 hover:text-zinc-100 transition-colors flex items-center gap-1"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
            <path d="M16 16h5v5" />
          </svg>
          Regenerate
        </button>
      </div>

      <div className="p-4">
        {error ? (
          <div className="text-sm text-red-400 font-mono">{error}</div>
        ) : (
          <pre className="text-sm text-zinc-300 font-mono overflow-x-auto">
            {preview}
          </pre>
        )}
      </div>

      {isArray && arrayCount > 3 && !error && (
        <div className="px-4 pb-3 text-xs text-zinc-500">
          Showing 3 of {arrayCount} items
        </div>
      )}
    </div>
  );
}
