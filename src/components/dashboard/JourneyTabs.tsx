"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/dashboard/journey", label: "Personal plan" },
  { href: "/dashboard/journey/academy", label: "Academy" },
];

export function JourneyTabs() {
  const pathname = usePathname();

  return (
    <div className="mb-7 flex justify-center">
      <div className="inline-flex gap-1 rounded-full border border-line bg-surface p-1">
        {TABS.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={`rounded-full px-5 py-2 text-[15px] transition ${
                active ? "bg-ink font-semibold text-white" : "text-ink-muted hover:text-ink-strong"
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
