"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { signOut } from "@/lib/auth-client";

interface DashboardNavProps {
  user: {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
  };
}

export function DashboardNav({ user }: DashboardNavProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname?.startsWith(path);
  };

  return (
    <header className="border-b border-zinc-800 bg-zinc-900/50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-xl font-mono text-blue-400">{"{ }"}</span>
            <span className="font-bold text-zinc-100">Mock API</span>
          </Link>

          <nav className="flex items-center gap-6">
            <Link
              href="/dashboard"
              className={`text-sm transition-colors ${
                isActive("/dashboard")
                  ? "text-blue-400 font-medium"
                  : "text-zinc-400 hover:text-zinc-100"
              }`}
            >
              Projects
            </Link>
            <Link
              href="/dashboard/api-keys"
              className={`text-sm transition-colors ${
                isActive("/dashboard/api-keys")
                  ? "text-blue-400 font-medium"
                  : "text-zinc-400 hover:text-zinc-100"
              }`}
            >
              API Keys
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-sm font-medium text-zinc-200">
              {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
            </div>
            <span className="text-sm text-zinc-300">
              {user.name || user.email}
            </span>
          </div>

          <button
            onClick={handleSignOut}
            className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
