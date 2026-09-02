import { z } from "zod";
import raw from "../../../../content/onboarding.json";

export const OnboardingOption = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  icon: z.string().optional(),
});

export const OnboardingStep = z.object({
  slug: z.string().min(1),
  type: z.enum(["single", "multi"]),
  title: z.string().min(1),
  subtitle: z.string().optional(),
  // Одиночний вибір веде далі одразу; мультивибір потребує кнопки.
  autoAdvance: z.boolean(),
  cta: z.string().optional(),
  options: z.array(OnboardingOption).min(2),
  next: z.string().nullable(),
});

export const OnboardingConfig = z.object({
  title: z.string().min(1),
  steps: z.array(OnboardingStep).min(1),
});

export type OnboardingOption = z.infer<typeof OnboardingOption>;
export type OnboardingStep = z.infer<typeof OnboardingStep>;

const config = OnboardingConfig.parse(raw);

export const ONBOARDING = config;
export const STEPS = config.steps;
export const FIRST_STEP = config.steps[0]!.slug;
export const COMPLETED = "completed";

export function getStep(slug: string): OnboardingStep | null {
  return STEPS.find((s) => s.slug === slug) ?? null;
}

export function stepIndex(slug: string): number {
  return STEPS.findIndex((s) => s.slug === slug);
}

export function nextStepSlug(slug: string): string {
  return getStep(slug)?.next ?? COMPLETED;
}

export function previousStepSlug(slug: string): string | null {
  const index = stepIndex(slug);
  return index > 0 ? STEPS[index - 1]!.slug : null;
}

/** Відповіді: рядок для single, масив рядків для multi. */
export type Answers = Record<string, string | string[]>;

export function normalizeAnswer(step: OnboardingStep, value: unknown): string | string[] | null {
  const ids = new Set(step.options.map((o) => o.id));

  if (step.type === "single") {
    return typeof value === "string" && ids.has(value) ? value : null;
  }

  if (!Array.isArray(value)) return null;
  const picked = value.filter((v): v is string => typeof v === "string" && ids.has(v));
  return picked.length > 0 ? picked : null;
}
