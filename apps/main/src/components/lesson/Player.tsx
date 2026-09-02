import { Link } from "react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@aishka/ui/primitives";
import type { Block } from "@aishka/core/content/blocks";
import { BlockView } from "./BlockView";
import { AiTaskModal } from "./AiTaskModal";
import { LessonRating } from "./LessonRating";

type Props = {
  slug: string;
  title: string;
  unitTitle: string;
  blocks: Block[];
  nextLessonSlug: string | null;
};

const positionKey = (slug: string) => `lesson-position:${slug}`;

export function Player({ slug, title, unitTitle, blocks, nextLessonSlug }: Props) {
  const [visible, setVisible] = useState(1);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [finished, setFinished] = useState(false);
  const [aiOpen, setAiOpen] = useState<string | null>(null);
  const [aiAttempted, setAiAttempted] = useState<Record<string, boolean>>({});
  const [aiSkipped, setAiSkipped] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const restored = useRef(false);

  // Вихід у будь-який момент зберігає позицію — повернення продовжує з того ж місця.
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    try {
      const saved = Number(sessionStorage.getItem(positionKey(slug)));
      if (Number.isFinite(saved) && saved > 1) setVisible(Math.min(saved, blocks.length));
    } catch {
      // приватний режим — просто починаємо спочатку
    }
  }, [slug, blocks.length]);

  useEffect(() => {
    try {
      sessionStorage.setItem(positionKey(slug), String(visible));
    } catch {
      // ignore
    }
  }, [slug, visible]);

  useEffect(() => {
    if (visible > 1) bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [visible]);

  const current = blocks[visible - 1]!;
  const isQuiz = current.type === "quiz";
  const isLast = visible === blocks.length;

  // Одна кнопка в одному місці змінює і текст, і дію — саме тому урок
  // читається як стрічка, а не як форма з трьома різними елементами.
  const cta = isQuiz && !checked[current.id]
    ? { label: "Check", disabled: !answers[current.id] }
    : isLast
      ? { label: "Finish lesson ›", disabled: false }
      : { label: "Continue", disabled: false };

  const select = useCallback((blockId: string, optionId: string) => {
    setAnswers((prev) => ({ ...prev, [blockId]: optionId }));
    // Нова відповідь скидає перевірку: спроби не обмежені.
    setChecked((prev) => ({ ...prev, [blockId]: false }));
  }, []);

  async function onAction() {
    if (isQuiz && !checked[current.id]) {
      setChecked((prev) => ({ ...prev, [current.id]: true }));
      return;
    }

    if (!isLast) {
      setVisible((v) => v + 1);
      return;
    }

    setSaving(true);
    try {
      await fetch(`/api/lessons/${slug}/complete`, { method: "POST" });
      try {
        sessionStorage.removeItem(positionKey(slug));
      } catch {
        // ignore
      }
      setFinished(true);
    } finally {
      setSaving(false);
    }
  }

  if (finished) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-[var(--container-reading)] flex-col items-center justify-center gap-5 px-5 py-16 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-success-tint text-[36px]">
          ✓
        </div>
        <h1 className="text-[28px] font-semibold text-ink-strong">Great work</h1>
        <p className="max-w-[42ch] text-[17px] leading-relaxed text-ink-body">
          You finished this lesson and moved one step forward.
        </p>

        {/* Оцінка не блокує перехід далі: тиск тут ламає темп навчання. */}
        <LessonRating slug={slug} />

        <div className="mt-3 flex w-full max-w-[var(--container-action)] flex-col gap-3">
          {nextLessonSlug ? (
            <Link to={`/dashboard/lesson/${nextLessonSlug}`}>
              <Button className="w-full">Next lesson ›</Button>
            </Link>
          ) : null}
          <Link to="/dashboard/journey">
            <Button variant="ghost" className="w-full">
              Back to my plan
            </Button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-dvh pb-32">
      <header className="sticky top-0 z-10 bg-canvas/90 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-[var(--container-reading)] items-center gap-4 rounded-[16px] border border-line bg-surface px-4 py-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-300"
              style={{ width: `${(visible / blocks.length) * 100}%` }}
            />
          </div>
          <Link
            to="/dashboard/journey"
            aria-label="Exit lesson"
            className="text-[20px] leading-none text-ink-muted transition hover:text-ink-strong"
          >
            ×
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[var(--container-reading)] px-5 pt-6">
        <p className="mb-1 text-[13px] font-semibold uppercase tracking-wider text-ink-muted">
          {unitTitle}
        </p>
        <h1 className="mb-7 text-[28px] font-semibold leading-tight text-ink-strong text-balance">
          {title}
        </h1>

        {/* Блоки накопичуються, а не замінюються: попереднє лишається доступним. */}
        <div className="flex flex-col gap-7">
          {blocks.slice(0, visible).map((block) => (
            <BlockView
              key={block.id}
              block={block}
              answer={answers[block.id]}
              checked={Boolean(checked[block.id])}
              onSelect={select}
              aiTask={
                block.type === "ai_task"
                  ? {
                      attempted: Boolean(aiAttempted[block.id]),
                      skipped: Boolean(aiSkipped[block.id]),
                      onOpen: () => setAiOpen(block.id),
                      onSkip: () => setAiSkipped((prev) => ({ ...prev, [block.id]: true })),
                    }
                  : undefined
              }
            />
          ))}
        </div>
        <div ref={bottomRef} />
      </main>

      {/* Модалка поверх уроку: закриття повертає рівно в те саме місце. */}
      {aiOpen
        ? (() => {
            const block = blocks.find((b) => b.id === aiOpen);
            if (!block || block.type !== "ai_task") return null;
            return (
              <AiTaskModal
                block={block}
                onClose={() => setAiOpen(null)}
                onResult={() => setAiAttempted((prev) => ({ ...prev, [block.id]: true }))}
              />
            );
          })()
        : null}

      <div className="fixed inset-x-0 bottom-0 bg-gradient-to-t from-canvas via-canvas to-transparent px-5 pb-6 pt-8">
        <div className="mx-auto w-full max-w-[var(--container-action)]">
          <Button
            variant="lesson"
            className="w-full"
            onClick={onAction}
            disabled={cta.disabled || saving}
          >
            {saving ? "Saving…" : cta.label}
          </Button>
        </div>
      </div>
    </div>
  );
}
