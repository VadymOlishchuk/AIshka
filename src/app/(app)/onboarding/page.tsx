import { redirect } from "next/navigation";
import { requireUser } from "@/core/auth/guards";
import { COMPLETED, FIRST_STEP, getStep } from "@/core/plan/onboarding";

// Маршрут визначає одне поле користувача — тому «застрягти посеред опитування» неможливо.
export default async function OnboardingEntry() {
  const user = await requireUser();

  if (user.onboardingDone || user.onboardingStep === COMPLETED) redirect("/dashboard");

  const step = getStep(user.onboardingStep) ?? getStep(FIRST_STEP)!;
  redirect(`/onboarding/${step.slug}`);
}
