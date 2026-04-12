"use client";

import Link from "next/link";
import { Eye, Sun, Moon } from "lucide-react";
import { useTheme } from "./theme-provider";

export function Nav() {
  const { theme, toggle } = useTheme();

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-[hsl(var(--bg)/0.8)] border-b border-[hsl(var(--border))]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-[hsl(338,89%,47%)] to-[hsl(338,89%,35%)] grid place-items-center text-white">
            <Eye className="w-4 h-4" />
          </span>
          PolicyLens
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link href="/" className="btn btn-ghost">
            Analyze
          </Link>
          <Link href="/portfolio" className="btn btn-ghost">
            <span className="hidden sm:inline">My portfolio</span>
            <span className="sm:hidden">Portfolio</span>
          </Link>
          <button
            onClick={toggle}
            className="btn btn-ghost p-2"
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>
        </nav>
      </div>
    </header>
  );
}
