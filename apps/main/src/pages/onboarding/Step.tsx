import { Link, Navigate, useParams, useRouteLoaderData } from "react-router";
import type { OnboardingStep as Step } from "@aishka/core/plan/onboarding";
import { StepForm } from "@/components/onboarding/StepForm";
import { ErrorPage } from "@/pages/ErrorPage";
import { useTitle } from "@aishka/ui/title";

export type OnboardingState = {
  steps: Step[];
  current: string;
  done: boolean;
  answers: Record<string, string | string[]>;
};

export function OnboardingStep() {
  const { step: slug } = useParams();
  const state = useRouteLoaderData("onboarding") as OnboardingState;
  const step = state.steps.find((s) => s.slug === slug);
  useTitle(step ? `${step.title} · AIshka` : "AIshka");

  if (!step) return <ErrorPage notFound />;
  // Онбординг можна перепройти з профілю — тому завершений стан тут не блокує.
  if (slug === undefined) return <Navigate to="/onboarding" replace />;

  const index = state.steps.findIndex((s) => s.slug === step.slug);
  const back = index > 0 ? state.steps[index - 1]!.slug : null;
  const saved = state.answers[step.slug] ?? null;

  return (
    <main className="mx-auto w-full max-w-[560px] px-5 py-8">
      <header className="mb-8 flex items-center gap-4">
        {back ? (
          <Link
            to={`/onboarding/${back}`}
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
              style={{ width: `${((index + 1) / state.steps.length) * 100}%` }}
            />
          </div>
        </div>

        <span className="text-[13px] tabular-nums text-ink-muted">
          {index + 1}/{state.steps.length}
        </span>
      </header>

      <h1 className="mb-2 text-[28px] font-semibold leading-tight text-ink-strong text-balance">
        {step.title}
      </h1>
      {step.subtitle ? <p className="mb-6 text-[16px] text-ink-muted">{step.subtitle}</p> : null}

      {/* key скидає вибір при переході між кроками — інакше стан їде за людиною. */}
      <StepForm key={step.slug} step={step} saved={saved} />
    </main>
  );
}
