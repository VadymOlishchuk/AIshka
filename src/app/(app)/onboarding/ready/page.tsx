import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/core/auth/guards";
import { readAnswers } from "@/core/plan/enroll";
import { explainFirstUnit } from "@/core/plan/rules";
import { Button, Card, GeneratedCover } from "@/components/ui/primitives";
import { duration, plural } from "@/lib/format";

export default async function PlanReadyPage() {
  const user = await requireUser();

  const enrollment = await db.enrollment.findFirst({
    where: { userId: user.id, isPrimary: true },
    include: { course: { include: { modules: { include: { _count: { select: { lessons: true } } } } } } },
  });
  if (!enrollment) redirect("/onboarding");

  const bySlug = new Map(enrollment.course.modules.map((m) => [m.slug, m]));
  const units = enrollment.moduleOrder.map((slug) => bySlug.get(slug)).filter((m) => m !== undefined);
  const lessons = units.reduce((n, m) => n + m._count.lessons, 0);
  const minutes = lessons * 6;

  const answers = await readAnswers(user.id);
  const why = explainFirstUnit(answers);

  return (
    <main className="mx-auto w-full max-w-[620px] px-5 py-12">
      <p className="mb-2 text-[14px] font-semibold uppercase tracking-wider text-accent">
        Your plan is ready
      </p>
      <h1 className="mb-3 text-[32px] font-semibold leading-tight text-ink-strong text-balance">
        {enrollment.course.title}
      </h1>
      <p className="mb-6 text-[17px] leading-relaxed text-ink-body">
        {plural(units.length, "unit", "units")} · {plural(lessons, "lesson", "lessons")} · about{" "}
        {duration(minutes)}
      </p>

      {why ? (
        <p className="mb-7 rounded-[10px] bg-accent-tint px-4 py-3 text-[15px] leading-relaxed text-ink-strong">
          {why}
        </p>
      ) : null}

      <div className="mb-8 flex flex-col gap-3">
        {units.slice(0, 3).map((unit, i) => (
          <Card key={unit.id} className="flex items-center gap-4 overflow-hidden p-3">
            <GeneratedCover seed={unit.slug} className="h-16 w-16 flex-none rounded-[10px]" />
            <div className="min-w-0">
              <p className="text-[12px] font-semibold uppercase tracking-wider text-ink-muted">
                Unit {i + 1}
              </p>
              <p className="text-[17px] font-semibold leading-snug text-ink-strong">{unit.title}</p>
            </div>
          </Card>
        ))}
      </div>

      <Link href="/dashboard">
        <Button className="w-full">Start learning</Button>
      </Link>
    </main>
  );
}
