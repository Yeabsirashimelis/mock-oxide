"use client";

import { useState } from "react";
import Link from "next/link";
import { useFeedback } from "@/components/ui/feedback";
import { ImportOpenAPIModal } from "./import-openapi-modal";

interface ProjectActionsMenuProps {
  projectSlug: string;
}

/**
 * Overflow menu for the project page's secondary actions, so the header
 * keeps a clear hierarchy: create/test/analytics visible, the rest here.
 */
export function ProjectActionsMenu({ projectSlug }: ProjectActionsMenuProps) {
  const { toast } = useFeedback();
  const [open, setOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setOpen(false);
    setIsExporting(true);
    try {
      const response = await fetch(`/api/projects/${projectSlug}/export`);
      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${projectSlug}-export.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast("Project exported");
    } catch (error) {
      toast("Failed to export project", "error");
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  const itemClass =
    "w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors flex items-center gap-2";

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="More actions"
        className="px-3 py-2 border border-zinc-700 hover:border-zinc-600 rounded-lg font-medium text-zinc-300 transition-colors"
      >
        ⋯
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-52 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-20 py-1">
            <button
              onClick={() => {
                setOpen(false);
                setImportOpen(true);
              }}
              className={itemClass}
            >
              Import OpenAPI
            </button>
            <button onClick={handleExport} disabled={isExporting} className={itemClass}>
              {isExporting ? "Exporting..." : "Export project"}
            </button>
            <Link
              href={`/dashboard/projects/${projectSlug}/settings`}
              onClick={() => setOpen(false)}
              className={itemClass}
            >
              Settings
            </Link>
          </div>
        </>
      )}

      <ImportOpenAPIModal
        projectSlug={projectSlug}
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
      />
    </div>
  );
}
