import Link from "next/link";
import { Button, Card, GeneratedCover } from "@/components/ui/primitives";
import { db } from "@/lib/db";

// Лендінг статичний заради швидкості, тому база потрібна під час збірки.
// Якщо вона недоступна (CI без БД) — сторінка збирається без каталогу,
// замість того щоб завалити весь білд.
async function loadCourses() {
  try {
    return await db.course.findMany({
      where: { isPublished: true },
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { modules: true } } },
      take: 6,
    });
  } catch {
    return [];
  }
}

export const revalidate = 3600;

export default async function LandingPage() {
  const courses = await loadCourses();

  return (
    <main className="mx-auto w-full max-w-[1080px] px-5 py-14">
      <section className="mb-14 max-w-[640px]">
        <h1 className="mb-4 text-[40px] font-bold leading-[1.05] tracking-tight text-ink-strong text-balance sm:text-[52px]">
          Stop collecting AI tips. Get your first paid project.
        </h1>
        <p className="mb-8 text-[18px] leading-relaxed text-ink-body">
          Answer six questions and get a plan built around what you want to sell, how much time you
          have, and what&apos;s actually stopping you. Short lessons, real examples, one step at a time.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/register">
            <Button>Build my plan</Button>
          </Link>
          <Link href="/login">
            <Button variant="ghost">Sign in</Button>
          </Link>
        </div>
      </section>

      {courses.length > 0 ? (
        <section>
          <h2 className="mb-4 text-[24px] font-semibold text-ink-strong">What&apos;s inside</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <Card key={course.id} className="overflow-hidden">
                <GeneratedCover seed={course.slug} className="aspect-[16/9]" />
                <div className="p-4">
                  <h3 className="mb-1.5 text-[20px] font-semibold leading-snug text-ink-strong">
                    {course.title}
                  </h3>
                  <p className="mb-3 text-[14px] leading-relaxed text-ink-muted">
                    {course.description}
                  </p>
                  <p className="text-[13px] text-ink-muted">🎓 {course._count.modules} units</p>
                </div>
              </Card>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
