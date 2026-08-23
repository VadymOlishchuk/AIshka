"use client";

import type { Block } from "@/core/content/blocks";

type Props = {
  block: Block;
  answer: string | undefined;
  checked: boolean;
  onSelect: (blockId: string, optionId: string) => void;
};

export function BlockView({ block, answer, checked, onSelect }: Props) {
  switch (block.type) {
    case "text":
      return (
        <section className="lesson-prose">
          {block.heading ? <h2>{block.heading}</h2> : null}
          <div dangerouslySetInnerHTML={{ __html: block.bodyHtml }} />
        </section>
      );

    case "quote":
      return (
        <blockquote className="border-t border-line pt-4 text-[18px] font-medium italic leading-relaxed text-ink-strong">
          {block.text}
        </blockquote>
      );

    case "image":
      // alt обов'язковий на рівні схеми — зображення без нього не публікується
      // eslint-disable-next-line @next/next/no-img-element
      return <img src={block.url} alt={block.alt} className="w-full rounded-[10px]" />;

    case "video":
      return (
        <section className="flex flex-col gap-3">
          <div className="aspect-video overflow-hidden rounded-[10px] bg-line">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${block.videoId}`}
              title={block.description.slice(0, 60)}
              allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture"
              allowFullScreen
              className="h-full w-full"
            />
          </div>
          <div className="lesson-prose">
            <h2>Video description</h2>
            <p>{block.description}</p>
          </div>
        </section>
      );

    case "try":
      return (
        <section className="rounded-[10px] border border-line bg-surface p-5">
          <h2 className="mb-3 text-[20px] font-semibold text-ink-strong">{block.heading}</h2>
          <ul className="flex flex-col gap-2.5">
            {block.items.map((item, i) => (
              <li key={i} className="flex gap-3 text-[16px] leading-relaxed text-ink-body">
                <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-accent-tint text-[12px] font-bold text-accent">
                  {i + 1}
                </span>
                {item}
              </li>
            ))}
          </ul>
        </section>
      );

    case "quiz": {
      const correct = checked && answer === block.correctId;
      const wrong = checked && answer !== block.correctId;

      return (
        <section className="rounded-[10px] bg-canvas p-5">
          <p className="mb-4 text-[17px] font-bold leading-snug text-ink-strong">{block.question}</p>

          <div className="flex flex-col gap-2.5" role="radiogroup" aria-label={block.question}>
            {block.options.map((option) => {
              const picked = answer === option.id;
              // Зелений показуємо ЛИШЕ коли людина відповіла правильно.
              // Підсвітити правильний варіант після помилки — означає дати
              // відповідь замість напрямку думки, і вправа перестає навчати.
              const isRight = correct && option.id === block.correctId;

              return (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={picked}
                  onClick={() => onSelect(block.id, option.id)}
                  className={`flex items-center gap-3 rounded-[10px] border px-4 py-3.5 text-left text-[16px] transition ${
                    isRight
                      ? "border-success bg-success-tint"
                      : picked && wrong
                        ? "border-error bg-error-tint"
                        : picked
                          ? "border-accent bg-accent-tint"
                          : "border-line bg-surface hover:border-accent/50"
                  }`}
                >
                  <span
                    aria-hidden
                    className={`h-5 w-5 flex-none rounded-full border-2 ${
                      isRight
                        ? "border-success bg-success"
                        : picked
                          ? "border-accent bg-accent"
                          : "border-line"
                    }`}
                  />
                  <span className="flex-1 text-ink-strong">{option.label}</span>
                </button>
              );
            })}
          </div>

          {/* Банер правильної відповіді повторює тезу, банер помилки дає напрямок,
              а не саму відповідь. Спроби не обмежені. */}
          {correct ? (
            <div className="mt-4 rounded-[10px] bg-success-tint p-4">
              <p className="mb-1 font-bold text-ink-strong">{block.successTitle}</p>
              <p className="text-[15px] leading-relaxed text-ink-body">{block.successBody}</p>
            </div>
          ) : null}

          {wrong ? (
            <div className="mt-4 rounded-[10px] bg-error-tint p-4">
              <p className="mb-1 font-bold text-ink-strong">Try again ❌</p>
              <p className="text-[15px] leading-relaxed text-ink-body">{block.wrongHint}</p>
            </div>
          ) : null}
        </section>
      );
    }

    case "summary":
      return (
        <section className="flex flex-col gap-3 rounded-[10px] border border-line bg-surface p-5">
          <h2 className="text-[20px] font-semibold text-ink-strong">Summary</h2>
          <p className="text-[16px] leading-relaxed text-ink-body">{block.body}</p>
          <p className="text-[15px] italic leading-relaxed text-ink-muted">{block.nextTeaser}</p>
        </section>
      );

    case "ai_task":
      return (
        <section className="rounded-[10px] border border-line bg-surface p-5">
          <h2 className="mb-1 text-[20px] font-semibold text-ink-strong">{block.title}</h2>
          <p className="text-[15px] text-ink-muted">{block.subtitle}</p>
        </section>
      );
  }
}
