import { redirect } from "next/navigation";
import { requireActiveAccess } from "@/core/auth/guards";
import { getUserPlan } from "@/core/progress/service";
import { UnitAccordion } from "@/components/dashboard/UnitAccordion";
import { JourneyTabs } from "@/components/dashboard/JourneyTabs";
import { ProgressBar } from "@/components/ui/primitives";

export default async function JourneyPage() {
  const user = await requireActiveAccess();
  if (!user.onboardingDone) redirect("/onboarding");

  const plan = await getUserPlan(user.id);
  if (!plan) redirect("/onboarding");

  const firstOpen = plan.units.findIndex((u) => !u.locked && u.completed < u.total);

  return (
    <main className="mx-auto w-full max-w-[840px] px-5 py-8">
      <JourneyTabs />

      <h1 className="mb-2 text-[28px] font-semibold leading-tight text-ink-strong">Your plan</h1>
      <p className="mb-4 text-[15px] text-ink-muted">
        Built from your answers. Lessons open one after another, so there&apos;s always exactly one
        next step.
      </p>

      <div className="mb-8">
        <ProgressBar value={plan.percent} className="mb-2" />
        <p className="text-[13px] tabular-nums text-ink-muted">
          {plan.completedLessons}/{plan.totalLessons} lessons · {Math.round(plan.percent)}%
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {plan.units.map((unit, index) => (
          <UnitAccordion
            key={unit.id}
            unit={unit}
            index={index}
            openByDefault={index === (firstOpen === -1 ? 0 : firstOpen)}
          />
        ))}
      </div>
    </main>
  );
}
