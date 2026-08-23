"use client";

import { useState } from "react";

export function LessonRating({ slug }: { slug: string }) {
  const [stars, setStars] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [rated, setRated] = useState(false);
  const [commentDone, setCommentDone] = useState(false);

  async function save(value: number, text: string) {
    try {
      await fetch(`/api/lessons/${slug}/rating`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stars: value, comment: text.trim() || undefined }),
      });
    } catch {
      // Оцінка необов'язкова: збій мережі не повинен нічого ламати на екрані.
    }
  }

  if (commentDone) {
    return <p className="mt-2 text-[15px] text-ink-muted">Thanks — that helps.</p>;
  }

  if (rated) {
    return (
      <div className="mt-2 flex w-full max-w-[var(--container-action)] flex-col items-center gap-3">
        <p className="text-[15px] text-ink-muted">Thanks — that helps.</p>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Anything you'd change about this lesson? (optional)"
          rows={2}
          className="w-full resize-none rounded-[10px] border border-line bg-surface px-4 py-3 text-[15px] outline-none transition focus:border-accent"
        />
        {comment.trim() ? (
          <button
            onClick={() => {
              setCommentDone(true);
              void save(stars, comment);
            }}
            className="text-[14px] font-semibold text-accent underline-offset-2 hover:underline"
          >
            Send comment
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mt-2 flex flex-col items-center gap-2">
      <p className="text-[15px] text-ink-muted">Rate this lesson</p>
      <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            aria-label={`${value} out of 5`}
            onMouseEnter={() => setHover(value)}
            onClick={() => {
              // Зірки заповнюються одразу — відповідь сервера тут нічого не вирішує.
              setStars(value);
              setRated(true);
              void save(value, "");
            }}
            className="text-[28px] leading-none transition"
            style={{ filter: (hover || stars) >= value ? "none" : "grayscale(1) opacity(.35)" }}
          >
            ⭐
          </button>
        ))}
      </div>
    </div>
  );
}
