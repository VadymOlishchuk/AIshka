import Link from "next/link";
import { requireActiveAccess } from "@/core/auth/guards";
import { getAcademyCatalog } from "@/core/progress/service";
import { JourneyTabs } from "@/components/dashboard/JourneyTabs";
import { Card, GeneratedCover, ProgressBar } from "@/components/ui/primitives";
import { duration, plural } from "@/lib/format";

const KIND_LABEL: Record<string, string> = {
  tool: "Tool course",
  challenge: "Challenge",
  mini: "Mini course",
};

export default async function AcademyPage() {
  const user = await requireActiveAccess();
  const courses = await getAcademyCatalog(user.id);

  // Полиці — це динамічні добірки над трьома форматами, а не окремі сутності.
  // І назва полиці має відповідати вмісту: «Top 5» із 13 курсів підриває довіру.
  const shelves = new Map<string, typeof courses>();
  for (const course of courses) {
    const key = course.shelf ?? "Everything else";
    shelves.set(key, [...(shelves.get(key) ?? []), course]);
  }

  return (
    <main className="mx-auto w-full max-w-[1100px] px-5 py-8">
      <JourneyTabs />

      <h1 className="mb-2 text-[28px] font-semibold leading-tight text-ink-strong">Academy</h1>
      <p className="mb-8 max-w-[64ch] text-[15px] text-ink-muted">
        Everything here is open from the start — take what you need, in any order. Progress is
        counted separately from your plan.
      </p>

      {courses.length === 0 ? (
        <Card className="p-6">
          <p className="text-[15px] text-ink-muted">
            No courses published yet. Your personal plan is where to start.
          </p>
        </Card>
      ) : (
        [...shelves.entries()].map(([shelf, items]) => (
          <section key={shelf} className="mb-10">
            <h2 className="mb-4 text-[22px] font-semibold text-ink-strong">
              {shelf}{" "}
              <span className="text-[15px] font-normal text-ink-muted">
                · {plural(items.length, "course", "courses")}
              </span>
            </h2>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((course) => (
                <Link key={course.id} href={`/dashboard/course/${course.slug}`} className="group">
                  <Card className="h-full overflow-hidden transition group-hover:border-accent/60">
                    <GeneratedCover seed={course.slug} className="aspect-[16/9]" />
                    <div className="p-4">
                      <p className="mb-1 text-[12px] font-semibold uppercase tracking-wider text-ink-muted">
                        {KIND_LABEL[course.kind] ?? "Course"}
                      </p>
                      <h3 className="mb-1.5 text-[20px] font-semibold leading-snug text-ink-strong">
                        {course.title}
                      </h3>
                      <p className="mb-3 line-clamp-3 text-[14px] leading-relaxed text-ink-muted">
                        {course.description}
                      </p>
                      <p className="mb-2 text-[13px] tabular-nums text-ink-muted">
                        🎓 {plural(course.lessons, "lesson", "lessons")} · 🕐{" "}
                        {duration(course.minutes)}
                      </p>
                      <ProgressBar value={(course.completed / course.lessons) * 100} />
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        ))
      )}
    </main>
  );
}
