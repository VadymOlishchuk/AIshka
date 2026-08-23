import Link from "next/link";
import type { CatalogCourse } from "@/core/progress/service";

/**
 * Вертикальний шлях: курси один під одним, з'єднані лінією.
 * Підсвічується той, який людина вже почала, або перший — щоб на екрані
 * завжди був рівно один очевидний наступний крок.
 */
export function CoursePath({ courses }: { courses: CatalogCourse[] }) {
  const nextIndex = Math.max(
    0,
    courses.findIndex((c) => c.completed > 0 && c.completed < c.lessons),
  );

  return (
    <ol className="relative flex flex-col gap-3">
      {courses.map((course, index) => {
        const percent = course.lessons > 0 ? (course.completed / course.lessons) * 100 : 0;
        const started = course.completed > 0;
        const done = course.lessons > 0 && course.completed === course.lessons;
        const highlighted = index === nextIndex;

        return (
          <li key={course.id} className="relative">
            {index < courses.length - 1 ? (
              <span
                aria-hidden
                className="absolute left-[52px] top-full h-3 w-px bg-line"
              />
            ) : null}

            <Link
              href={`/dashboard/course/${course.slug}`}
              className={`flex items-center gap-4 rounded-[16px] border px-4 py-4 transition ${
                highlighted
                  ? "border-accent/40 bg-accent-tint"
                  : "border-line bg-surface hover:border-accent/40"
              }`}
            >
              <span
                aria-hidden
                className="flex h-14 w-14 flex-none items-center justify-center rounded-[12px] bg-canvas text-[30px] leading-none"
              >
                {course.icon ?? "📘"}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-[19px] font-semibold leading-snug text-ink-strong">
                  {course.title}
                </span>

                {started ? (
                  <>
                    <span className="mt-2 block h-1.5 w-full overflow-hidden rounded-full bg-line">
                      <span
                        className="block h-full rounded-full bg-ok"
                        style={{ width: `${Math.max(percent, 3)}%` }}
                      />
                    </span>
                    <span className="mt-1.5 block text-[14px] tabular-nums text-ink-muted">
                      {done ? "Finished" : `${Math.round(percent)}% complete`}
                    </span>
                  </>
                ) : (
                  <span className="mt-1 block text-[14px] text-ink-muted">Not started</span>
                )}
              </span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
