import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/core/auth/guards";
import { getStep, previousStepSlug, stepIndex, STEPS } from "@/core/plan/onboarding";
import { StepForm } from "@/components/onboarding/StepForm";

export default async function OnboardingStepPage({
  params,
}: {
  params: Promise<{ step: string }>;
}) {
  const { step: slug } = await params;
  const user = await requireUser();
  const step = getStep(slug);

  if (!step) notFound();
  // Онбординг можна перепройти з профілю — тому завершений стан тут не блокує.

  const saved = await db.onboardingAnswer.findUnique({
    where: { userId_stepSlug: { userId: user.id, stepSlug: step.slug } },
  });

  const index = stepIndex(step.slug);
  const back = previousStepSlug(step.slug);

  return (
    <main className="mx-auto w-full max-w-[560px] px-5 py-8">
      <header className="mb-8 flex items-center gap-4">
        {back ? (
          <Link
            href={`/onboarding/${back}`}
            aria-label="Back"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink-muted transition hover:text-ink-strong"
          >
            ←
          </Link>
        ) : (
          <span className="h-9 w-9" />
        )}

        <div className="flex-1">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full bg-accent transition-[width]"
              style={{ width: `${((index + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        <span className="text-[13px] tabular-nums text-ink-muted">
          {index + 1}/{STEPS.length}
        </span>
      </header>

      <h1 className="mb-2 text-[28px] font-semibold leading-tight text-ink-strong text-balance">
        {step.title}
      </h1>
      {step.subtitle ? <p className="mb-6 text-[16px] text-ink-muted">{step.subtitle}</p> : null}

      <StepForm step={step} saved={(saved?.value as string | string[]) ?? null} />
    </main>
  );
}
