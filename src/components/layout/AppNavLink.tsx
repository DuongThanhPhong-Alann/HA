"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AppNavLink({ href, className, children }: { href: string; className: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href || (href === "/measurements" && pathname.startsWith("/measurements/") && pathname !== "/measurements/new");
  return <Link href={href} aria-current={active ? "page" : undefined} className={`${className} app-nav-link${active ? " app-nav-link--active" : ""}`}>{children}</Link>;
}
