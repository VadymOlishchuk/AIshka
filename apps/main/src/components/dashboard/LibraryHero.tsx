import { Link } from "react-router";
import type { CatalogCourse } from "@aishka/core/progress/service";
import { Emoji } from "@aishka/ui/emoji";
import { ArrowIcon } from "@aishka/ui/icons";

/**
 * Шапка бібліотеки — та сама картка курсу, тільки одна й велика: біла
 * картка, кольорова підкладка, білий підвал з дією. Тому вона не спорить
 * з полицями нижче, а відкриває їх.
 *
 * Підвал — список того, що людина почала й не закінчила. До трьох рядків:
 * перший з кнопкою, решта з кільцем прогресу. Далі — лише лічильник:
 * четвертий і п'ятий «продовжити» уже не підказка, а ще одна полиця.
 * Нічого не почато — один рядок «почни звідси».
 */
const MAX_ROWS = 3;

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

  // Найближчі до фінішу — вгору: їх найлегше закрити, і це найкраща мотивація.
  const inProgress = courses
    .filter((c) => c.completed > 0 && c.completed < c.lessons)
    .sort((a, b) => b.completed / b.lessons - a.completed / a.lessons);
  const rows = inProgress.length > 0 ? inProgress.slice(0, MAX_ROWS) : courses.filter((c) => c.completed === 0).slice(0, 1);
  const hidden = Math.max(0, inProgress.length - MAX_ROWS);
  const lead = rows[0];

  return (
    <section className="mb-10 rounded-[24px] border border-[rgba(18,20,43,.06)] bg-surface p-2.5 shadow-[0_14px_40px_rgba(18,20,43,.08)]">
      <div className="relative overflow-hidden rounded-[17px] bg-accent-tint p-5 pr-24 sm:p-6 sm:pr-32">
        {/* Значок курсу з першого рядка — шапка й перша дія читаються як одне. */}
        {lead?.icon ? (
          <span aria-hidden className="pointer-events-none absolute right-5 top-1/2 h-[76px] w-[76px] -translate-y-1/2 sm:h-[92px] sm:w-[92px]">
            <Emoji symbol={lead.icon} className="h-full w-full object-contain" fallbackSize="text-[60px]" />
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

      {rows.length > 0 ? (
        <div className="px-2 pb-1 pt-3">
          <p className="mb-1 px-2.5 text-[11px] font-bold uppercase tracking-[.14em] text-ink-muted">
            {inProgress.length > 0 ? (
              <>
                In progress
                <span className="ml-1.5 text-ink-muted/60 tabular-nums">{inProgress.length}</span>
              </>
            ) : (
              "Start here"
            )}
          </p>

          <ul className="divide-y divide-line">
            {rows.map((course, i) => (
              <li key={course.id}>
                <ContinueRow course={course} lead={i === 0} />
              </li>
            ))}
          </ul>

          {hidden > 0 ? (
            <p className="px-2.5 pb-1.5 pt-2.5 text-[13px] text-ink-muted">
              +{hidden} more in progress — they&apos;re on the shelves below
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

/**
 * Рядок «продовжити». Перший — з кнопкою, бо це головна дія сторінки.
 * Решта — кільце прогресу й стрілка: видно, скільки лишилось, без ще однієї
 * кнопки, що спорила б із першою.
 */
function ContinueRow({ course, lead }: { course: CatalogCourse; lead: boolean }) {
  const started = course.completed > 0;
  const percent = course.lessons > 0 ? Math.round((course.completed / course.lessons) * 100) : 0;

  return (
    <Link
      to={`/courses/${course.slug}`}
      className="group flex items-center gap-3 rounded-[14px] px-2.5 py-3 transition hover:bg-paper-alt"
    >
      <span className="flex h-11 w-11 flex-none items-center justify-center rounded-[12px] bg-accent-tint">
        <Emoji symbol={course.icon} className="h-7 w-7 object-contain" fallbackSize="text-[22px]" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-extrabold tracking-[-0.015em] text-ink-strong">
          {course.title}
        </span>
        <span className="block text-[12.5px] tabular-nums text-ink-muted">
          {started
            ? `Lesson ${Math.min(course.completed + 1, course.lessons)} of ${course.lessons}`
            : `${course.lessons} lessons · ${course.minutes}m`}
        </span>
      </span>

      {lead ? (
        <span className="flex flex-none items-center gap-2 rounded-full bg-ink-strong px-4 py-2.5 text-[13px] font-bold text-white transition group-hover:bg-accent">
          {started ? "Continue" : "Start"}
          <ArrowIcon className="h-[15px] w-[15px] flex-none transition-transform duration-300 group-hover:translate-x-0.5" />
        </span>
      ) : (
        <>
          <Ring percent={percent} />
          <ArrowIcon className="h-[16px] w-[16px] flex-none text-ink-muted transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-accent" />
        </>
      )}
    </Link>
  );
}

/** Кільце прогресу: 30px, лавандовий трек, індигова дуга. Читається без цифр. */
function Ring({ percent }: { percent: number }) {
  const r = 12;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 30 30" className="h-[30px] w-[30px] flex-none -rotate-90" aria-label={`${percent}% done`}>
      <circle cx="15" cy="15" r={r} fill="none" stroke="var(--color-accent-tint)" strokeWidth="3.5" />
      <circle
        cx="15"
        cy="15"
        r={r}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - Math.max(percent, 4) / 100)}
      />
    </svg>
  );
}
