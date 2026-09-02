import { z } from "zod";
import raw from "../../../../content/plan-rules.json";
import type { Answers } from "./onboarding";

const Rule = z.object({
  when: z.record(z.string(), z.array(z.string())),
  add: z.array(z.string()).optional(),
  position: z.enum(["start", "end"]).optional(),
  promote: z.string().optional(),
});

const PlanRules = z.object({
  course: z.string().min(1),
  base: z.array(z.string()).min(1),
  rules: z.array(Rule),
  tail: z.array(z.string()),
  length: z.record(z.string(), z.number().int().positive()),
});

export type PlanRules = z.infer<typeof PlanRules>;

export const RULES: PlanRules = PlanRules.parse(raw);

/** Правило спрацьовує, якщо відповідь користувача перетинається зі списком у `when`. */
function matches(when: Record<string, string[]>, answers: Answers): boolean {
  return Object.entries(when).every(([key, wanted]) => {
    const given = answers[key];
    if (given === undefined) return false;
    const values = Array.isArray(given) ? given : [given];
    return values.some((v) => wanted.includes(v));
  });
}

/**
 * Збирає персональний набір і порядок юнітів.
 * Детермінований: ті самі відповіді завжди дають той самий план.
 */
export function buildPlan(answers: Answers, rules: PlanRules = RULES): string[] {
  const units = [...rules.base];
  const promotions: string[] = [];

  for (const rule of rules.rules) {
    if (!matches(rule.when, answers)) continue;

    if (rule.add) {
      if (rule.position === "start") units.unshift(...rule.add);
      else units.push(...rule.add);
    }
    if (rule.promote) promotions.push(rule.promote);
  }

  units.push(...rules.tail);

  const ordered = dedupe(units);

  // Те, що людина назвала своїм головним блокером, іде першим:
  // саме цей юніт пояснює на екрані «чому план починається звідси».
  for (const slug of promotions.reverse()) {
    const index = ordered.indexOf(slug);
    if (index > 0) ordered.splice(0, 0, ordered.splice(index, 1)[0]!);
  }

  const time = typeof answers.time === "string" ? answers.time : "30min";
  const limit = rules.length[time] ?? 16;

  return ordered.slice(0, limit);
}

function dedupe(items: string[]): string[] {
  const seen = new Set<string>();
  return items.filter((item) => (seen.has(item) ? false : (seen.add(item), true)));
}

/** Пояснення для екрана «Ваш план готовий»: персоналізація, яку не пояснили, не відчувається. */
export function explainFirstUnit(answers: Answers): string | null {
  const blocker = typeof answers.blocker === "string" ? answers.blocker : null;
  switch (blocker) {
    case "clients":
      return "You said finding clients is the hard part, so that unit comes first.";
    case "pricing":
      return "You said pricing is the hard part, so that unit comes first.";
    case "skills":
      return "You weren't sure your skills are ready — so we start by picking one service you can already sell.";
    case "confidence":
      return "You said you keep putting it off, so we start with the shortest path to a first result.";
    default:
      return null;
  }
}
