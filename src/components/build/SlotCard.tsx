"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Pill } from "@/components/ui/primitives";
import type { BuildSlot } from "@/core/build/service";

const KIND_LABEL: Record<string, string> = {
  image: "image",
  text: "text",
  video: "video",
  doc: "document",
  profile: "profile",
};

/**
 * Слот у збірці. Порожній навмисно виглядає порожнім — пунктир і світле тло.
 * Це не оздоблення: незакритий гештальт тягне сильніше за будь-яку цифру.
 */
export function SlotCard({ slot, open = false }: { slot: BuildSlot; open?: boolean }) {
  const [expanded, setExpanded] = useState(open);
  const [note, setNote] = useState(slot.note ?? "");
  const [pending, start] = useTransition();
  const router = useRouter();

  function send(action: "fill" | "clear") {
    start(async () => {
      await fetch("/api/build/slot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotId: slot.id, action, note }),
      });
      router.refresh();
    });
  }

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className={`flex w-full items-center gap-3 rounded-[14px] px-4 py-3 text-left transition ${
          slot.filled
            ? "border border-line bg-surface hover:border-accent/50"
            : "border border-dashed border-line-strong bg-paper-alt/60 hover:border-accent"
        }`}
      >
        <span
          aria-hidden
          className={`flex h-6 w-6 flex-none items-center justify-center rounded-full text-[13px] font-bold ${
            slot.filled ? "bg-accent text-white" : "border border-dashed border-line-strong"
          }`}
        >
          {slot.filled ? "✓" : ""}
        </span>
        <span className="min-w-0 flex-1">
          <span
            className={`block truncate text-[15px] font-semibold ${
              slot.filled ? "text-ink-strong" : "text-ink-muted"
            }`}
          >
            {slot.title}
          </span>
        </span>
        <span className="flex-none text-[13px] tabular-nums text-ink-muted">{slot.minutes} min</span>
      </button>
    );
  }

  return (
    <div className="rounded-[16px] border border-accent bg-surface p-5 shadow-[0_14px_40px_rgba(18,20,43,.08)]">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Pill tone="mark">{KIND_LABEL[slot.kind] ?? slot.kind}</Pill>
        {slot.format ? <Pill tone="muted">{slot.format}</Pill> : null}
        <Pill tone="muted">{slot.minutes} min</Pill>
      </div>

      <h4 className="mb-2 text-[19px] font-extrabold leading-snug text-ink-strong">{slot.title}</h4>
      <p className="mb-4 text-[14.5px] leading-relaxed text-ink-muted">{slot.brief}</p>

      {/* Урок приходить у момент затику, а не наперед. */}
      {slot.lessonSlug ? (
        <Link
          href={`/dashboard/lesson/${slot.lessonSlug}`}
          className="mb-4 inline-flex items-center gap-1.5 text-[14.5px] font-semibold text-accent hover:underline"
        >
          How do I do this? ›
        </Link>
      ) : null}

      <label className="mb-2 block text-[13px] font-semibold text-ink-muted" htmlFor={`n-${slot.id}`}>
        What did you make? A link or one line is enough.
      </label>
      <input
        id={`n-${slot.id}`}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={300}
        placeholder="A link, a filename, or a note to yourself"
        className="mb-4 w-full rounded-[10px] border border-line bg-canvas px-3 py-2.5 text-[15px] text-ink-strong outline-none focus:border-accent"
      />

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => send("fill")} disabled={pending}>
          {slot.filled ? "Update" : "Mark as done"}
        </Button>
        {slot.filled ? (
          <button
            onClick={() => send("clear")}
            disabled={pending}
            className="text-[14px] text-ink-muted transition hover:text-ink-strong"
          >
            Empty this slot
          </button>
        ) : null}
        <button
          onClick={() => setExpanded(false)}
          className="ml-auto text-[14px] text-ink-muted transition hover:text-ink-strong"
        >
          Close
        </button>
      </div>
    </div>
  );
}
