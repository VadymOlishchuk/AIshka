import Link from "next/link";

const ICONS: Record<string, string> = {
  Careers: "💼",
  Text: "💬",
  Images: "🖼️",
  Challenges: "📋",
  "Tool courses": "🛠️",
};

export function ShelfTabs({ shelves, active }: { shelves: string[]; active: string }) {
  return (
    <div className="mb-8 flex gap-3 overflow-x-auto pb-1">
      {shelves.map((shelf) => {
        const current = shelf === active;
        return (
          <Link
            key={shelf}
            href={`/dashboard/journey/academy?shelf=${encodeURIComponent(shelf)}`}
            aria-current={current ? "page" : undefined}
            className={`flex min-w-[112px] flex-none flex-col items-center gap-1.5 rounded-[16px] border px-4 py-3 transition ${
              current
                ? "border-accent bg-accent-tint"
                : "border-line bg-surface hover:border-accent/40"
            }`}
          >
            <span aria-hidden className="text-[26px] leading-none">
              {ICONS[shelf] ?? "📚"}
            </span>
            <span
              className={`text-[14px] leading-tight ${
                current ? "font-semibold text-ink-strong" : "text-ink-muted"
              }`}
            >
              {shelf}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
