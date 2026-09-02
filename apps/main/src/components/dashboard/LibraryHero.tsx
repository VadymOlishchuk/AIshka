import { Link } from "react-router";
import type { CatalogCourse } from "@aishka/core/progress/service";
import { Emoji } from "@aishka/ui/emoji";
import { ArrowIcon } from "@aishka/ui/icons";

/**
 * Шапка бібліотеки — це та сама картка курсу, тільки одна й велика:
 * біла картка, кольорова підкладка, білий підвал з дією. Тому вона не спорить
 * з полицями нижче, а відкриває їх.
 *
 * Що прибрано і чому:
 *   — темна панель на весь екран: на телефоні вона з'їдала перший екран цілком;
 *   — «0%» великими цифрами й «0 of 119»: новачку це не прогрес, а докір;
 *   — серія днів: у базі немає історії входів, показувати вигадку не можна.
 *
 * Лишилось те, що працює: де ти є (одним рядком) і куди йти далі (одна кнопка).
 */
export function LibraryHero({
  firstName,
  courses,
}: {
  firstName: string;
  courses: CatalogCourse[];
}) {
  const lessonsDone = courses.reduce((n, c) => n + c.completed, 0);
  const lessonsTotal = courses.reduce((n, c) => n + c.lessons, 0);
  const finished = courses.filter((c) => c.lessons > 0 && c.completed === c.lessons).length;
  const percent = lessonsTotal > 0 ? Math.round((lessonsDone / lessonsTotal) * 100) : 0;

  // Кинуте посередині — найкращий кандидат на продовження; далі ще не почате.
  const pick =
    courses.find((c) => c.completed > 0 && c.completed < c.lessons) ??
    courses.find((c) => c.completed === 0) ??
    courses[0];
  const started = Boolean(pick && pick.completed > 0);

  return (
    <section className="mb-10 rounded-[24px] border border-[rgba(18,20,43,.06)] bg-surface p-2.5 shadow-[0_14px_40px_rgba(18,20,43,.08)]">
      <div className="relative overflow-hidden rounded-[17px] bg-accent-tint p-5 pr-24 sm:p-6 sm:pr-32">
        {/* Значок наступного курсу — той самий, що на його картці нижче. */}
        {pick?.icon ? (
          <span aria-hidden className="pointer-events-none absolute right-5 top-1/2 h-[76px] w-[76px] -translate-y-1/2 sm:h-[92px] sm:w-[92px]">
            <Emoji symbol={pick.icon} className="h-full w-full object-contain" fallbackSize="text-[60px]" />
          </span>
        ) : null}

        <h1 className="mb-1.5 text-[24px] leading-[1.1] tracking-[-0.03em] text-ink-strong sm:text-[28px]">
          {lessonsDone === 0 ? `Let's begin, ${firstName}` : `Welcome back, ${firstName}`}
        </h1>

        <p className="text-[14px] leading-relaxed text-ink-strong/65">
          {lessonsDone === 0 ? (
            <>
              {lessonsTotal} lessons across {courses.length} courses. Every one is open — start
              anywhere.
            </>
          ) : (
            <>
              <span className="font-bold text-ink-strong tabular-nums">{lessonsDone}</span> lessons
              done
              {finished > 0 ? (
                <>
                  , <span className="font-bold text-ink-strong tabular-nums">{finished}</span>{" "}
                  {finished === 1 ? "course" : "courses"} finished
                </>
              ) : null}{" "}
              · {percent}% of the library
            </>
          )}
        </p>

        {/* Смуга є лише коли є що показати: порожня смуга — це ще один нуль. */}
        {lessonsDone > 0 ? (
          <span className="mt-4 block h-1.5 w-full max-w-[280px] overflow-hidden rounded-full bg-surface/70">
            <span className="block h-full rounded-full bg-accent" style={{ width: `${Math.max(percent, 3)}%` }} />
          </span>
        ) : null}
      </div>

      {/* Підвал як у картки курсу: факт ліворуч, єдина дія праворуч. */}
      {pick ? (
        <Link
          to={`/courses/${pick.slug}`}
          className="group flex items-center justify-between gap-4 px-[18px] pb-1.5 pt-4"
        >
          <span className="min-w-0">
            <span className="mb-0.5 block text-[11px] font-bold uppercase tracking-[.14em] text-ink-muted">
              {started ? "Continue" : "Start here"}
            </span>
            <span className="block truncate text-[16px] font-extrabold tracking-[-0.02em] text-ink-strong">
              {pick.title}
            </span>
            <span className="block text-[13px] tabular-nums text-ink-muted">
              {started
                ? `Lesson ${Math.min(pick.completed + 1, pick.lessons)} of ${pick.lessons}`
                : `${pick.lessons} lessons · ${pick.minutes}m`}
            </span>
          </span>

          <span className="flex flex-none items-center gap-2 rounded-full bg-ink-strong px-5 py-3 text-[13.5px] font-bold text-white transition group-hover:bg-accent">
            {started ? "Continue" : "Start"}
            <ArrowIcon className="h-[16px] w-[16px] flex-none transition-transform duration-300 group-hover:translate-x-0.5" />
          </span>
        </Link>
      ) : null}
    </section>
  );
}
