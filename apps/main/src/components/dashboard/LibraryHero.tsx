import { Link } from "react-router";
import { Emoji } from "@aishka/ui/emoji";
import { ArrowIcon, FlameIcon } from "@aishka/ui/icons";
import type { CatalogCourse } from "@aishka/core/progress/service";

/**
 * Шапка бібліотеки: ліворуч стан великим планом, праворуч — біла картка курсу,
 * до якого треба повернутися.
 *
 * Попередній варіант складав сім блоків у стовпчик і тому читався як панель
 * адміністратора. Тут дві зони й один контраст: біле на темному. Картка світла
 * посеред темної панелі — єдина яскрава пляма, і саме вона тримає погляд.
 *
 * ВАЖЛИВО: серія днів поки що макет. Для неї потрібна історія входів, якої в
 * базі немає — коли з'явиться, замінити STREAK на реальне число.
 */
const STREAK = 5;

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
  const pickPercent =
    pick && pick.lessons > 0 ? Math.round((pick.completed / pick.lessons) * 100) : 0;

  return (
    <section className="relative mb-10 overflow-hidden rounded-[28px] bg-ink-panel text-white">
      {/* Два джерела світла: тепле індигове праворуч і холодне ліворуч унизу.
          Разом дають об'єм, якого не дає жодна плоска заливка. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-40 h-[420px] w-[420px] rounded-full opacity-80 blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(79,63,255,.6), transparent 70%)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -left-24 h-72 w-72 rounded-full opacity-50 blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(231,228,255,.35), transparent 70%)" }}
      />

      <div className="relative grid gap-8 p-7 sm:p-10 lg:grid-cols-[1fr_320px] lg:items-center lg:gap-12">
        <div>
          <div className="mb-6 flex items-center gap-3">
            <span className="text-[11.5px] font-bold uppercase tracking-[.16em] text-muted-on-dark">
              Your progress
            </span>
            <span aria-hidden className="h-px w-8 bg-white/20" />
            <span className="flex items-center gap-1.5 text-[12.5px] font-bold text-accent-tint">
              <FlameIcon className="h-4 w-4 flex-none" />
              {STREAK} days
            </span>
          </div>

          <h1 className="mb-7 text-[40px] leading-[.98] tracking-[-0.04em] sm:text-[52px]">
            {lessonsDone === 0 ? (
              <>
                Let&apos;s begin,
                <br />
                {firstName}
              </>
            ) : (
              <>
                Keep going,
                <br />
                {firstName}
              </>
            )}
          </h1>

          {/* Відсоток великий і стоїть у рядку з лінією: цифра — теж типографіка. */}
          <div className="flex items-end gap-5">
            <span className="text-[38px] font-extrabold leading-none tracking-[-0.03em] tabular-nums">
              {percent}
              <span className="text-[20px] text-muted-on-dark">%</span>
            </span>

            <div className="flex-1 pb-1.5">
              <span className="mb-2.5 block h-1.5 w-full overflow-hidden rounded-full bg-white/15">
                <span
                  className="block h-full rounded-full bg-accent-tint transition-[width] duration-700"
                  style={{ width: `${percent === 0 ? 2 : percent}%` }}
                />
              </span>
              <p className="text-[13px] tabular-nums text-muted-on-dark">
                {lessonsDone} of {lessonsTotal} lessons
                {finished > 0 ? ` · ${finished} ${finished === 1 ? "course" : "courses"} done` : null}
              </p>
            </div>
          </div>
        </div>

        {/* Біла картка на темному: єдина яскрава пляма — і одразу зрозуміло, куди тиснути. */}
        {pick ? (
          <Link
            to={`/courses/${pick.slug}`}
            className="group block rounded-[22px] bg-surface p-5 text-ink-strong shadow-[0_24px_60px_rgba(0,0,0,.4)] transition duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 hover:shadow-[0_30px_70px_rgba(0,0,0,.5)]"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <span className="text-[11px] font-bold uppercase tracking-[.14em] text-ink-muted">
                {pick.completed > 0 ? "Continue" : "Start here"}
              </span>
              <span className="flex h-14 w-14 flex-none items-center justify-center">
                <Emoji
                  symbol={pick.icon}
                  className="h-full w-full object-contain transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:-translate-y-0.5 group-hover:scale-105"
                  fallbackSize="text-[40px]"
                />
              </span>
            </div>

            <h2 className="mb-1 text-[21px] leading-[1.15] tracking-[-0.025em]">{pick.title}</h2>
            <p className="mb-4 text-[13px] tabular-nums text-ink-muted">
              {pick.completed > 0
                ? `Lesson ${Math.min(pick.completed + 1, pick.lessons)} of ${pick.lessons}`
                : `${pick.lessons} lessons · ${pick.minutes}m`}
            </p>

            <span className="mb-5 block h-1.5 w-full overflow-hidden rounded-full bg-paper-alt">
              <span
                className="block h-full rounded-full bg-accent"
                style={{ width: `${pickPercent === 0 ? 4 : pickPercent}%` }}
              />
            </span>

            <span className="flex items-center justify-center gap-2 rounded-full bg-accent px-5 py-3 text-[14px] font-bold text-white shadow-[0_8px_22px_rgba(79,63,255,.28)] transition group-hover:brightness-110">
              {pick.completed > 0 ? "Continue" : "Start"}
              <ArrowIcon className="h-[17px] w-[17px] flex-none transition-transform duration-300 group-hover:translate-x-0.5" />
            </span>
          </Link>
        ) : null}
      </div>
    </section>
  );
}
