import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/nav";

export const metadata: Metadata = {
  title: "PolicyLens — See through the fine print",
  description:
    "Upload a policy, get a plain-English breakdown of coverage, exclusions, waiting periods, and the gaps your plan leaves on the table.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen grid-bg">
        <Nav />
        {children}
      </body>
    </html>
  );
}
