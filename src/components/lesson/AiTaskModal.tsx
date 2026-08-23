"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/primitives";
import type { AiTaskBlock } from "@/core/content/blocks";

// Кожна складена пара отримує власний колір замість єдиного «вибраного» стану.
// Так видно, що з чим зв'язано, без ліній і стрілок — дешево й дуже читабельно.
const PAIR_COLORS = ["#4caf7d", "#e8a33c", "#a172ff"] as const;

type Props = {
  block: AiTaskBlock;
  onClose: () => void;
  onResult: (correct: boolean) => void;
};

export function AiTaskModal({ block, onClose, onResult }: Props) {
  // Права колонка перемішується, інакше пари складаються рядок у рядок без думання.
  const right = useMemo(() => shuffle(block.pairs.map((p, i) => ({ index: i, text: p.right.text }))), [block]);

  const [links, setLinks] = useState<Record<number, number>>({}); // лівий індекс → правий індекс
  const [activeLeft, setActiveLeft] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const linkedRight = new Set(Object.values(links));
  const allLinked = Object.keys(links).length === block.pairs.length;
  const allCorrect = block.pairs.every((_, i) => links[i] === i);

  function pickLeft(index: number) {
    if (checked) return;
    if (links[index] !== undefined) {
      setLinks(({ [index]: _removed, ...rest }) => rest);
      setActiveLeft(null);
      return;
    }
    setActiveLeft(activeLeft === index ? null : index);
  }

  function pickRight(rightIndex: number) {
    if (checked) return;

    const owner = Object.entries(links).find(([, v]) => v === rightIndex)?.[0];
    if (owner !== undefined) {
      setLinks(({ [Number(owner)]: _removed, ...rest }) => rest);
      return;
    }
    if (activeLeft === null) return;

    setLinks((prev) => ({ ...prev, [activeLeft]: rightIndex }));
    setActiveLeft(null);
  }

  function colorFor(leftIndex: number | undefined) {
    return leftIndex === undefined ? null : PAIR_COLORS[leftIndex % PAIR_COLORS.length]!;
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-canvas" role="dialog" aria-modal="true">
      <header className="flex items-center gap-3 px-5 py-4">
        <button
          onClick={onClose}
          className="text-[16px] text-ink-muted transition hover:text-ink-strong"
        >
          ‹ AI Task
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-5 pb-40">
        <div className="mx-auto w-full max-w-[var(--container-reading)]">
          <h2 className="mb-1 text-[24px] font-semibold leading-snug text-ink-strong text-balance">
            {block.title}
          </h2>
          <p className="mb-7 text-[16px] text-ink-muted">{block.subtitle}</p>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-3">
              {block.pairs.map((pair, i) => {
                const color = colorFor(links[i] !== undefined ? i : undefined);
                const wrong = checked && links[i] !== i;
                return (
                  <button
                    key={i}
                    onClick={() => pickLeft(i)}
                    className={`rounded-[10px] border-2 bg-surface p-4 text-left text-[15px] leading-snug text-ink-strong transition ${
                      activeLeft === i ? "border-accent" : "border-line"
                    } ${wrong ? "border-error bg-error-tint" : ""}`}
                    style={color && !wrong ? { borderColor: color, background: `${color}18` } : undefined}
                  >
                    {pair.left.label ? (
                      <span className="mb-1 block text-[12px] uppercase tracking-wider text-ink-muted">
                        {pair.left.label}
                      </span>
                    ) : null}
                    {pair.left.text}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col gap-3">
              {right.map((item) => {
                const owner = Object.entries(links).find(([, v]) => v === item.index)?.[0];
                const color = colorFor(owner === undefined ? undefined : Number(owner));
                const wrong = checked && owner !== undefined && Number(owner) !== item.index;
                return (
                  <button
                    key={item.index}
                    onClick={() => pickRight(item.index)}
                    disabled={activeLeft === null && !linkedRight.has(item.index)}
                    className={`rounded-[10px] border-2 bg-surface p-4 text-left text-[15px] leading-snug text-ink-strong transition disabled:opacity-55 ${
                      wrong ? "border-error bg-error-tint" : "border-line"
                    }`}
                    style={color && !wrong ? { borderColor: color, background: `${color}18` } : undefined}
                  >
                    {item.text}
                  </button>
                );
              })}
            </div>
          </div>

          {checked ? (
            <div
              className={`mt-6 rounded-[10px] p-4 ${allCorrect ? "bg-success-tint" : "bg-error-tint"}`}
            >
              <p className="mb-1 font-bold text-ink-strong">
                {allCorrect ? "All matched 🔥" : "Not quite ❌"}
              </p>
              <p className="text-[15px] leading-relaxed text-ink-body">
                {allCorrect
                  ? "Every action lines up with what it produces. That link is the whole point of the exercise."
                  : block.failHint}
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 bg-gradient-to-t from-canvas via-canvas to-transparent px-5 pb-6 pt-8">
        <div className="mx-auto flex w-full max-w-[var(--container-action)] flex-col gap-3">
          {checked && !allCorrect ? (
            <Button
              variant="lesson"
              className="w-full"
              onClick={() => {
                setChecked(false);
                setLinks({});
              }}
            >
              Try again ↻
            </Button>
          ) : checked ? (
            <Button
              className="w-full"
              onClick={() => {
                onResult(true);
                onClose();
              }}
            >
              Back to the lesson
            </Button>
          ) : (
            <Button
              variant="lesson"
              className="w-full"
              disabled={!allLinked}
              onClick={() => {
                setChecked(true);
                onResult(allCorrect);
              }}
            >
              Check
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}
