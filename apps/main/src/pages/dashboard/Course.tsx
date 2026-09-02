import { Link, useLoaderData } from "react-router";
import type { CourseView } from "@aishka/core/progress/service";
import { Button, Card, GeneratedCover, IconTile, ProgressBar } from "@aishka/ui/primitives";
import { Emoji } from "@aishka/ui/emoji";
import { useTitle } from "@aishka/ui/title";

export function Course() {
  const course = useLoaderData() as CourseView;
  useTitle(`${course.title} · AIshka`);

  const percent =
    course.totalLessons > 0 ? (course.completedLessons / course.totalLessons) * 100 : 0;

  return (
    <main className="mx-auto w-full max-w-[840px] px-5 py-8">
      <Link
        to="/library"
        className="mb-5 inline-block text-[14px] text-ink-muted transition hover:text-ink-strong"
      >
        ‹ Library
      </Link>

      <Card className="mb-8 overflow-hidden">
        <div className="relative">
          <GeneratedCover seed={course.slug} className="aspect-[21/9]" />
          {course.icon ? (
            // Та сама іконка, що на картці в полиці — сторінка впізнається як те,
            // на що людина щойно натиснула.
            <span
              aria-hidden
              className="absolute bottom-4 left-5 flex h-14 w-14 items-center justify-center rounded-[14px] bg-surface shadow-sm"
            >
              <Emoji symbol={course.icon} className="h-9 w-9 object-contain" fallbackSize="text-[30px]" />
            </span>
          ) : null}
        </div>
        <div className="p-6">
          <h1 className="mb-2 text-[28px] font-semibold leading-tight text-ink-strong text-balance">
            {course.title}
          </h1>
          <p className="mb-5 max-w-[64ch] text-[16px] leading-relaxed text-ink-body">
            {course.description}
          </p>

          <ProgressBar value={percent} className="mb-2 max-w-[320px]" />
          <p className="mb-5 text-[13px] tabular-nums text-ink-muted">
            {course.completedLessons}/{course.totalLessons} lessons
          </p>

          {course.nextLessonSlug ? (
            <Link to={`/lessons/${course.nextLessonSlug}`}>
              <Button>{course.completedLessons > 0 ? "Continue" : "Start the first lesson"}</Button>
            </Link>
          ) : (
            <p className="text-[15px] font-semibold text-success">Finished — every lesson complete.</p>
          )}
        </div>
      </Card>

      {course.units.map((unit) => (
        <section key={unit.id} className="mb-6">
          {course.units.length > 1 ? (
            <div className="mb-3 flex items-start gap-3">
              <IconTile icon={unit.icon} seed={unit.slug} size="text-[24px]" className="h-11 w-11 flex-none" />
              <div className="min-w-0">
                <h2 className="text-[20px] font-semibold leading-snug text-ink-strong">{unit.title}</h2>
                <p className="text-[14px] text-ink-muted">{unit.description}</p>
              </div>
            </div>
          ) : null}

          <Card className="divide-y divide-line">
            {unit.lessons.map((lesson, i) => (
              <div key={lesson.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] uppercase tracking-wider text-ink-muted">
                    Lesson {i + 1} · {lesson.durationMin} min
                  </p>
                  <p className="text-[16px] font-medium leading-snug text-ink-strong">{lesson.title}</p>
                </div>

                <Link
                  to={`/lessons/${lesson.slug}`}
                  className={
                    lesson.completed
                      ? "text-[14px] font-semibold text-ink-muted underline-offset-2 hover:underline"
                      : "rounded-[10px] bg-accent px-4 py-2 text-[14px] font-bold text-white transition hover:brightness-95"
                  }
                >
                  {lesson.completed ? "Repeat this lesson?" : "Start"}
                </Link>
              </div>
            ))}
          </Card>
        </section>
      ))}
    </main>
  );
}
