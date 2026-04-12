import Link from "next/link";
import { Eye } from "lucide-react";

export function Nav() {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-black/40 border-b border-[#2C3B57]">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#E20A7F] to-[#4a2ecc] grid place-items-center">
            <Eye className="w-4 h-4" />
          </span>
          PolicyLens
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link href="/" className="btn btn-ghost">
            Analyze
          </Link>
          <Link href="/portfolio" className="btn btn-ghost">
            My portfolio
          </Link>
        </nav>
      </div>
    </header>
  );
}
