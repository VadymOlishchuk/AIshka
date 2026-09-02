import { z } from "zod";

/**
 * ЗБІРКА. Проєкт — це не курс із відсотком, а річ, яка росте.
 *
 * Конкуренти влаштовані однаково: впорядкований список контейнерів і смужка
 * «68%». Тут одиниця — слот під конкретний артефакт. Порожній слот видно
 * фізично, і це працює як незакритий гештальт, а не як цифра.
 */

const slugField = z
  .string()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9-]+$/, "Слаг: тільки [a-z0-9-]");

export const SlotInput = z.object({
  slug: slugField,
  title: z.string().min(6).max(90),
  kind: z.enum(["image", "text", "video", "doc", "profile"]),
  format: z.string().max(40).nullable().default(null),
  minutes: z.number().int().min(5).max(40),
  brief: z
    .string()
    .min(40, "Бриф вирішує, чи вважати слот заповненим — одним словом не обійтись"),
  // Урок доставляється в момент затику, а не наперед. Слот без уроку —
  // це слот, у якому користувач застрягне без виходу.
  lessonSlug: slugField,
});

export const StageInput = z.object({
  slug: slugField,
  title: z.string().min(3).max(60),
  intent: z.string().min(20, "Навіщо ця стадія — інакше вона просто папка"),
  icon: z.string().max(8).nullable().default(null),
  slots: z.array(SlotInput).min(2),
});

export const ProjectInput = z.object({
  slug: slugField,
  title: z.string().min(6).max(90),
  description: z.string().min(30),
  outcome: z.string().min(20, "Що буде в руках наприкінці — людською мовою"),
  estimate: z.string().min(6).max(60),
  coverUrl: z.string().nullable().default(null),
  sortOrder: z.number().int().nonnegative().default(0),
  stages: z.array(StageInput).min(3),
});

export type SlotInput = z.infer<typeof SlotInput>;
export type StageInput = z.infer<typeof StageInput>;
export type ProjectInput = z.infer<typeof ProjectInput>;

export type Issue = { where: string; problem: string };

const PLACEHOLDER = /lorem ipsum|\btodo\b|\btbd\b|coming soon|заглушка/i;

/** Ті самі власні назви, що і в гейті уроків: заголовки пишемо реченням. */
const PROPER = new Set(
  `AI HR PM CRM CV PDF URL API SEO UK US EU
   ChatGPT Claude Gemini Perplexity NotebookLM Copilot DeepSeek Midjourney Canva
   Google Microsoft Word Excel Outlook Teams LinkedIn Instagram Facebook TikTok
   YouTube Slack Stripe Figma I`.split(/\s+/),
);

function titleCaseWords(text: string): string[] {
  return text
    .split(/[\s—–-]+/)
    .slice(1)
    .filter((w) => /^[A-Z][a-z]+$/.test(w) && !PROPER.has(w));
}

/**
 * Гейт публікації проєкту. Той самий принцип, що й для уроків: проєкт, який
 * його не пройшов, у базу не потрапляє.
 */
export function checkProject(project: ProjectInput): Issue[] {
  const issues: Issue[] = [];
  const add = (where: string, problem: string) => issues.push({ where, problem });

  const slots = project.stages.flatMap((s) => s.slots);

  // Менше — не збірка, а чекліст. Більше — людина не дійде до кінця.
  if (slots.length < 12) add(project.slug, `${slots.length} слотів, треба від 12`);
  if (slots.length > 30) add(project.slug, `${slots.length} слотів, треба до 30`);
  if (project.stages.length > 7) add(project.slug, `${project.stages.length} стадій, треба до 7`);

  const total = slots.reduce((n, s) => n + s.minutes, 0);
  const claimed = /(\d+)\s*(тиж|week)/i.exec(project.estimate);
  if (claimed) {
    // «3 тижні по 15 хвилин» ≈ 315 хв. Розходження більше ніж удвічі — обман.
    const weeks = Number(claimed[1]);
    const realistic = weeks * 7 * 15;
    if (total > realistic * 2 || total * 2 < realistic) {
      add(project.slug, `оцінка «${project.estimate}» не відповідає ${total} хв роботи в слотах`);
    }
  }

  const seenSlot = new Set<string>();
  for (const stage of project.stages) {
    if (PLACEHOLDER.test(stage.intent)) add(stage.slug, "заглушка в описі стадії");

    for (const slot of stage.slots) {
      const where = `${stage.slug}/${slot.slug}`;
      if (seenSlot.has(slot.slug)) add(where, "слаг слота повторюється в межах проєкту");
      seenSlot.add(slot.slug);

      if (PLACEHOLDER.test(slot.brief)) add(where, "заглушка в брифі");

      const offenders = titleCaseWords(slot.title);
      if (offenders.length > 0) {
        add(where, `назва слота в Title Case — з малої мають бути ${offenders.join(", ")}`);
      }

      // Бриф має описувати результат, а не тему. Перевіряємо наявність
      // кількості, обсягу або формату — цифрою чи словом. Без цього
      // «зроби банер» проходить як бриф, а це не бриф.
      const CONCRETE =
        /\d|\b(one|two|three|four|five|six|seven|eight|nine|ten|twelve|fifteen)\b|format|version|word|second|line|package|sample|frame|каталог/i;
      if (!CONCRETE.test(slot.brief)) {
        add(where, "бриф без конкретики: немає ні кількості, ні формату, ні обсягу");
      }
    }
  }

  return issues;
}
