import Link from "next/link";
import { redirect } from "next/navigation";
import { requireActiveAccess } from "@/core/auth/guards";
import { getUserPlan } from "@/core/progress/service";
import { Button, Card, ProgressBar } from "@/components/ui/primitives";

export default async function DashboardHome() {
  const user = await requireActiveAccess();
  if (!user.onboardingDone) redirect("/onboarding");

  const plan = await getUserPlan(user.id);
  if (!plan) redirect("/onboarding");

  const percent = Math.round(plan.percent);

  return (
    <main className="mx-auto w-full max-w-[1290px] px-5 py-8">
      <h1 className="mb-6 text-[28px] font-semibold leading-tight text-ink-strong">
        Welcome, {user.firstName}
      </h1>

      {/* Картка активного плану: ракета летить по треку від старту до фінішу. */}
      <section className="mb-8 overflow-hidden rounded-[16px] bg-ink p-6 text-white sm:p-8">
        <span className="inline-block rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[.14em]">
          Personal plan
        </span>

        <h2 className="mb-2 mt-4 text-[24px] font-semibold leading-snug text-balance">
          {plan.courseTitle}
        </h2>
        <p className="mb-6 max-w-[60ch] text-[15px] leading-relaxed text-white/70">
          {plan.courseDescription}
        </p>

        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between text-[13px] text-white/70">
            <span aria-hidden>🚀</span>
            <span className="tabular-nums font-semibold text-white">{percent}%</span>
            <span aria-hidden>🏁</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-accent transition-[width]"
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="mt-2 text-[13px] text-white/60 tabular-nums">
            {plan.completedLessons} of {plan.totalLessons} lessons · {plan.units.length}{" "}
            {plan.units.length === 1 ? "unit" : "units"}
          </p>
        </div>

        {plan.nextLesson ? (
          <Link href={`/dashboard/lesson/${plan.nextLesson.slug}`}>
            <Button className="w-full sm:w-auto">Continue learning ⚡</Button>
          </Link>
        ) : (
          <Link href="/dashboard/journey">
            <Button className="w-full sm:w-auto">Review your plan</Button>
          </Link>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-[24px] font-semibold text-ink-strong">Up next</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plan.units.slice(0, 3).map((unit) => (
            <Card key={unit.id} className="p-5">
              <h3 className="mb-1.5 text-[20px] font-semibold leading-snug text-ink-strong">
                {unit.title}
              </h3>
              <p className="mb-4 text-[14px] leading-relaxed text-ink-muted">{unit.description}</p>
              <ProgressBar value={unit.total > 0 ? (unit.completed / unit.total) * 100 : 0} />
              <p className="mt-2 text-[13px] tabular-nums text-ink-muted">
                {unit.completed}/{unit.total} lessons
              </p>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
