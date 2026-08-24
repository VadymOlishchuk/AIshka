import Link from "next/link";
import { notFound } from "next/navigation";
import { requireActiveAccess } from "@/core/auth/guards";
import { getCourseForUser } from "@/core/progress/service";
import { Button, Card, GeneratedCover, IconTile, ProgressBar } from "@/components/ui/primitives";

export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const user = await requireActiveAccess();
  const { slug } = await params;

  const course = await getCourseForUser(user.id, slug);
  if (!course) notFound();

  const percent =
    course.totalLessons > 0 ? (course.completedLessons / course.totalLessons) * 100 : 0;

  return (
    <main className="mx-auto w-full max-w-[840px] px-5 py-8">
      <Link
        href="/dashboard/journey/academy"
        className="mb-5 inline-block text-[14px] text-ink-muted transition hover:text-ink-strong"
      >
        ‹ Academy
      </Link>

      <Card className="mb-8 overflow-hidden">
        <div className="relative">
          <GeneratedCover seed={course.slug} className="aspect-[21/9]" />
          {course.icon ? (
            // Та сама іконка, що на картці в полиці — сторінка впізнається як те,
            // на що людина щойно натиснула.
            <span
              aria-hidden
              className="absolute bottom-4 left-5 flex h-14 w-14 items-center justify-center rounded-[14px] bg-surface text-[30px] leading-none shadow-sm"
            >
              {course.icon}
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
            <Link href={`/dashboard/lesson/${course.nextLessonSlug}`}>
              <Button>
                {course.completedLessons > 0 ? "Continue ⚡" : "Start the first lesson ⚡"}
              </Button>
            </Link>
          ) : (
            <p className="text-[15px] font-semibold text-ok">Finished — every lesson complete.</p>
          )}
        </div>
      </Card>

      {course.units.map((unit) => (
        <section key={unit.id} className="mb-6">
          {course.units.length > 1 ? (
            <div className="mb-3 flex items-start gap-3">
              <IconTile
                icon={unit.icon}
                seed={unit.slug}
                size="text-[24px]"
                className="h-11 w-11 flex-none"
              />
              <div className="min-w-0">
                <h2 className="text-[20px] font-semibold leading-snug text-ink-strong">
                  {unit.title}
                </h2>
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
                  <p className="text-[16px] font-medium leading-snug text-ink-strong">
                    {lesson.title}
                  </p>
                </div>

                <Link
                  href={`/dashboard/lesson/${lesson.slug}`}
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
