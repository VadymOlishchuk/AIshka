import { Link } from "react-router";
import { useState } from "react";
import { IconTile, ProgressBar } from "@aishka/ui/primitives";
import type { PlanUnit } from "@aishka/core/progress/service";

export function UnitAccordion({ unit, index, openByDefault }: { unit: PlanUnit; index: number; openByDefault: boolean }) {
  const [open, setOpen] = useState(openByDefault);
  const percent = unit.total > 0 ? (unit.completed / unit.total) * 100 : 0;

  return (
    <article className="overflow-hidden rounded-[16px] border border-line bg-surface">
      <div className="flex gap-4 p-4 sm:p-5">
        {/* Заблокований юніт приглушений, але впізнаваний: сірий квадрат
            читався як порожній стан, а не як «поки закрито». */}
        <IconTile
          icon={unit.icon}
          seed={unit.slug}
          muted={unit.locked}
          size="text-[34px]"
          className="h-20 w-20 flex-none"
        />

        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-ink-muted">
            Unit {index + 1}
          </p>
          <h3 className="mb-1 text-[20px] font-semibold leading-snug text-ink-strong">
            {unit.title}
          </h3>
          <p className="mb-3 line-clamp-2 text-[14px] leading-relaxed text-ink-muted">
            {unit.description}
          </p>

          <ProgressBar value={percent} className="mb-2 max-w-[280px]" />
          <p className="text-[13px] tabular-nums text-ink-muted">
            {unit.completed}/{unit.total} lessons
          </p>
        </div>
      </div>

      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full border-t border-line px-5 py-3 text-[15px] font-semibold text-accent transition hover:bg-canvas"
      >
        {open ? "Hide lessons" : "Show lessons"}
      </button>

      {open ? (
        <ul className="border-t border-line">
          {unit.lessons.map((lesson, i) => (
            <li
              key={lesson.id}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line px-5 py-4 last:border-b-0"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[12px] uppercase tracking-wider text-ink-muted">
                  Lesson {i + 1} · {lesson.durationMin} min
                </p>
                <p className="text-[16px] font-medium leading-snug text-ink-strong">
                  {lesson.title}
                </p>
              </div>

              {lesson.completed ? (
                <Link
                  to={`/lessons/${lesson.slug}`}
                  className="text-[14px] font-semibold text-ink-muted underline-offset-2 hover:underline"
                >
                  Repeat this lesson?
                </Link>
              ) : lesson.locked ? (
                <span className="text-[14px] text-ink-muted">Available after previous</span>
              ) : (
                <Link
                  to={`/lessons/${lesson.slug}`}
                  className="rounded-[10px] bg-accent px-4 py-2 text-[14px] font-bold text-white transition hover:brightness-95"
                >
                  Start
                </Link>
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}
