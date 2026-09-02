"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Персональний план замінено Збіркою й винесено в окремий розділ навігації.
// Тут лишилась бібліотека — вона потрібна як довідник, а не як другий шлях.
const TABS = [
  { href: "/dashboard/build", label: "Your build" },
  { href: "/dashboard/journey/academy", label: "Library" },
];

export function JourneyTabs() {
  const pathname = usePathname();

  return (
    <div className="mb-7 flex justify-center">
      <div className="inline-flex gap-1 rounded-full border border-line bg-surface p-1">
        {TABS.map((tab) => {
          const active = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={`rounded-full px-5 py-2 text-[15px] transition ${
                active ? "bg-accent font-bold text-white" : "text-ink-muted hover:text-ink-strong"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
