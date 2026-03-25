"use client";
import { usePathname } from "next/navigation";
import ThemeSwitch from "@/components/Navbar/ThemeSwitch";
export default function Navbar() {
  const pathname = usePathname();
  const isWorkspaceRoute = pathname === "/workspace";

  return (
    <nav className="sticky h-14 md:px-8 px-2 inset-x-0 top-0 z-30 w-full border-b border-gray-200 backdrop-blur-lg transition-all">
      <div className="flex h-14 items-center justify-between border-b border-zinc-200">
        {!isWorkspaceRoute && (
          <div className="logo"></div>
        )}
        <div className="hidden items-center space-x-4 sm:flex">
          <ThemeSwitch />
        </div>
      </div>
    </nav>
  );
}
