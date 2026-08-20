"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";

/**
 * App-wide user feedback: success/error toasts and a styled confirm dialog
 * that replaces the browser-native `confirm()` popups.
 */

interface Toast {
  id: number;
  message: string;
  variant: "success" | "error";
}

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  /** Styles the confirm button red for destructive actions. */
  destructive?: boolean;
}

interface FeedbackContextValue {
  toast: (message: string, variant?: Toast["variant"]) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

export function useFeedback(): FeedbackContextValue {
  const ctx = useContext(FeedbackContext);
  if (!ctx) {
    throw new Error("useFeedback must be used inside FeedbackProvider");
  }
  return ctx;
}

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmOptions | null>(null);
  const resolverRef = useRef<((ok: boolean) => void) | null>(null);
  const idRef = useRef(0);

  const toast = useCallback(
    (message: string, variant: Toast["variant"] = "success") => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev, { id, message, variant }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3500);
    },
    []
  );

  const confirm = useCallback((options: ConfirmOptions) => {
    setConfirmState(options);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const settle = (ok: boolean) => {
    resolverRef.current?.(ok);
    resolverRef.current = null;
    setConfirmState(null);
  };

  return (
    <FeedbackContext.Provider value={{ toast, confirm }}>
      {children}

      {/* Toast stack */}
      {toasts.length > 0 && (
        <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`px-4 py-2.5 rounded-lg border text-sm shadow-lg ${
                t.variant === "success"
                  ? "bg-zinc-900 border-emerald-500/30 text-emerald-300"
                  : "bg-zinc-900 border-red-500/30 text-red-300"
              }`}
            >
              {t.message}
            </div>
          ))}
        </div>
      )}

      {/* Confirm dialog */}
      {confirmState && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]"
          onClick={() => settle(false)}
        >
          <div
            className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 w-full max-w-sm mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-zinc-100 mb-2">
              {confirmState.title}
            </h2>
            <p className="text-sm text-zinc-400 mb-6">{confirmState.message}</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => settle(false)}
                className="px-4 py-2 border border-zinc-700 hover:border-zinc-600 text-zinc-300 text-sm font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                autoFocus
                onClick={() => settle(true)}
                className={`px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors ${
                  confirmState.destructive
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {confirmState.confirmLabel || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </FeedbackContext.Provider>
  );
}
