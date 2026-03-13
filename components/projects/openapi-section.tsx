"use client";

import { useState } from "react";
import { ImportOpenAPIModal } from "./import-openapi-modal";

interface OpenAPISectionProps {
  projectSlug: string;
}

export function OpenAPISection({ projectSlug }: OpenAPISectionProps) {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  return (
    <>
      <div>
        <label className="block text-sm text-zinc-400 mb-1">OpenAPI Specification</label>

        {/* Export */}
        <div className="mb-3">
          <p className="text-xs text-zinc-500 mb-2">Export your API as OpenAPI 3.0 spec:</p>
          <div className="flex items-center gap-2">
            <a
              href={`/api/projects/${projectSlug}/openapi?format=json`}
              download={`${projectSlug}-openapi.json`}
              className="px-3 py-2 text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded transition-colors flex items-center gap-2"
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
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" x2="12" y1="3" y2="15" />
              </svg>
              Export JSON
            </a>
            <a
              href={`/api/projects/${projectSlug}/openapi?format=yaml`}
              download={`${projectSlug}-openapi.yaml`}
              className="px-3 py-2 text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded transition-colors flex items-center gap-2"
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
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" x2="12" y1="3" y2="15" />
              </svg>
              Export YAML
            </a>
          </div>
        </div>

        {/* Import */}
        <div>
          <p className="text-xs text-zinc-500 mb-2">Import endpoints from an OpenAPI spec:</p>
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors flex items-center gap-2"
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
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" x2="12" y1="15" y2="3" />
            </svg>
            Import from OpenAPI
          </button>
        </div>

        <p className="text-xs text-zinc-500 mt-3">
          Compatible with Postman, Insomnia, Swagger Editor, and any OpenAPI-compatible tool.
        </p>
      </div>

      <ImportOpenAPIModal
        projectSlug={projectSlug}
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />
    </>
  );
}
