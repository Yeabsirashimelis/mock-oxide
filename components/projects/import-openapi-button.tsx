"use client";

import { useState } from "react";
import { ImportOpenAPIModal } from "./import-openapi-modal";

interface ImportOpenAPIButtonProps {
  projectSlug: string;
}

export function ImportOpenAPIButton({ projectSlug }: ImportOpenAPIButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="px-4 py-2 border border-zinc-700 hover:border-zinc-600 rounded-lg font-medium text-zinc-300 transition-colors flex items-center gap-2"
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
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" x2="12" y1="15" y2="3" />
        </svg>
        Import OpenAPI
      </button>

      <ImportOpenAPIModal
        projectSlug={projectSlug}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
