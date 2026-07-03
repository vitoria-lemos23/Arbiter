"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "My Tournaments" },
  { href: "/discover", label: "Discover" },
  { href: "/profile", label: "Profile" },
] as const;

function isActive(pathname: string, href: string) {
  // "/" must match exactly; section roots match their whole subtree.
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

/** Primary section navigation, highlighting the current route. */
export function MainNav({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <nav className={cn("flex items-center gap-1.5 text-sm", className)}>
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={isActive(pathname, item.href) ? "page" : undefined}
          className={cn(
            "rounded-md px-2.5 py-1.5 font-medium transition-colors",
            isActive(pathname, item.href)
              ? "bg-muted text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
