"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const LINKS = [
  { href: "/dashboard", label: "Home", icon: "🏠" },
  { href: "/dashboard/build", label: "Build", icon: "🧱" },
  { href: "/dashboard/journey", label: "Library", icon: "📚" },
];

export function TopBar({ firstName }: { firstName: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  // Плеєр навмисно позбавлений навігації: лише прогрес, контент і одна дія.
  if (pathname.includes("/lesson/")) return null;

  return (
    <header className="sticky top-0 z-20 px-4 pt-4">
      <nav className="mx-auto flex max-w-[1290px] items-center gap-4 rounded-full border border-[rgba(18,20,43,.06)] bg-surface px-5 py-3 shadow-[0_14px_40px_rgba(18,20,43,.08)]">
        <Link href="/dashboard" className="text-[17px] font-extrabold tracking-[-0.03em] text-ink-strong">
          AIshka
        </Link>

        <div className="mx-auto flex items-center gap-1">
          {LINKS.map((link) => {
            const active =
              link.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-[15px] transition ${
                  active ? "bg-accent-tint font-semibold text-accent" : "text-ink-muted hover:text-ink-strong"
                }`}
              >
                <span aria-hidden>{link.icon}</span>
                <span className="hidden sm:inline">{link.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/profile"
            className="hidden text-[15px] text-ink-muted transition hover:text-ink-strong sm:inline"
          >
            {firstName}
          </Link>
          <button
            onClick={signOut}
            className="rounded-full border border-line px-4 py-2 text-[14px] text-ink-muted transition hover:border-line-strong hover:text-ink-strong"
          >
            Sign out
          </button>
        </div>
      </nav>
    </header>
  );
}
