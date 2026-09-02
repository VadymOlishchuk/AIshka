import Link from "next/link";
import { requireActiveAccess } from "@/core/auth/guards";
import { getAcademyCatalog } from "@/core/progress/service";
import { JourneyTabs } from "@/components/dashboard/JourneyTabs";
import { ShelfTabs } from "@/components/dashboard/ShelfTabs";
import { CoursePath } from "@/components/dashboard/CoursePath";
import Image from "next/image";
import { Card, GeneratedCover, ProgressBar } from "@/components/ui/primitives";
import { duration, plural } from "@/lib/format";

const KIND_LABEL: Record<string, string> = {
  career: "Career course",
  tool: "Tool course",
  challenge: "Challenge",
  mini: "Mini course",
};

// Порядок полиць фіксований: професії першими, бо це найширший вхід у каталог.
const SHELF_ORDER = ["Careers", "Text", "Images", "Challenges", "Tool courses"];

// Полиці, які показуються вертикальним шляхом, а не сіткою:
// коли курсів багато й вони однакового формату, список читається швидше.
const PATH_SHELVES = new Set(["Careers", "Text", "Images"]);

export default async function AcademyPage({
  searchParams,
}: {
  searchParams: Promise<{ shelf?: string }>;
}) {
  const user = await requireActiveAccess();
  const courses = await getAcademyCatalog(user.id);
  const { shelf: requested } = await searchParams;

  // Полиці — динамічні добірки над форматами, а не окремі сутності.
  const shelves = new Map<string, typeof courses>();
  for (const course of courses) {
    const key = course.shelf ?? "Everything else";
    shelves.set(key, [...(shelves.get(key) ?? []), course]);
  }

  const names = [...shelves.keys()].sort((a, b) => {
    const ai = SHELF_ORDER.indexOf(a);
    const bi = SHELF_ORDER.indexOf(b);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi) || a.localeCompare(b);
  });

  const active = requested && shelves.has(requested) ? requested : (names[0] ?? "");
  const items = shelves.get(active) ?? [];

  return (
    <main className="mx-auto w-full max-w-[1100px] px-5 py-8">
      <JourneyTabs />

      <h1 className="mb-2 text-[34px] font-extrabold leading-[1.1] text-ink-strong">Academy</h1>
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
        <>
          <ShelfTabs shelves={names} active={active} />

          {PATH_SHELVES.has(active) ? (
            <CoursePath courses={items} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((course) => (
                <Link key={course.id} href={`/dashboard/course/${course.slug}`} className="group">
                  <Card className="h-full overflow-hidden transition group-hover:border-accent">
                    {/* Обкладинки квадратні — це плитки в стилі іконок, не банери. */}
                    {course.coverUrl ? (
                      <Image
                        src={course.coverUrl}
                        alt=""
                        width={800}
                        height={800}
                        className="aspect-square w-full object-cover"
                      />
                    ) : (
                      <GeneratedCover seed={course.slug} className="aspect-square" />
                    )}
                    <div className="p-4">
                      <p className="mb-1 text-[12px] font-semibold uppercase tracking-wider text-ink-muted">
                        {KIND_LABEL[course.kind] ?? "Course"}
                      </p>
                      <h3 className="mb-1.5 text-[19px] font-bold leading-snug text-ink-strong">
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
          )}
        </>
      )}

    </main>
  );
}
