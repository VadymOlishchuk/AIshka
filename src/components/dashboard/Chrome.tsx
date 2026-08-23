"use client";

import { usePathname } from "next/navigation";

/** Урок — окремий режим: жодних посилань убік, лише прогрес, контент і одна дія. */
export function DashboardFooter() {
  const pathname = usePathname();
  if (pathname.includes("/lesson/")) return null;

  return (
    <footer className="px-5 pb-10 pt-16 text-center text-[13px] text-ink-muted">
      © {new Date().getFullYear()} AIshka
    </footer>
  );
}
