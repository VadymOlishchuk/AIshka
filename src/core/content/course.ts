import { z } from "zod";
import { Block, countWords, isQuiz, stripHtml } from "./blocks";

const slugField = z
  .string()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9-]+$/, "Слаг: тільки [a-z0-9-], без пробілів, регістру й двокрапок");

export const LessonInput = z.object({
  slug: slugField,
  title: z.string().min(3).max(120),
  durationMin: z.number().int().positive("Тривалість має бути більшою за нуль"),
  blocks: z.array(Block).min(1),
});

export const ModuleInput = z.object({
  slug: slugField,
  title: z.string().min(3).max(120),
  description: z.string().min(20, "Опис юніта продає його в каталозі — порожнім бути не може"),
  lessons: z.array(LessonInput).default([]),
});

export const CourseInput = z.object({
  slug: slugField,
  title: z.string().min(3).max(120),
  description: z.string().min(20, "Опис курсу продає його в каталозі — порожнім бути не може"),
  kind: z.enum(["plan", "tool", "challenge", "mini", "career"]),
  icon: z.string().max(8).nullable().default(null),
  shelf: z.string().nullable().default(null),
  sortOrder: z.number().int().nonnegative().default(0),
  modules: z.array(ModuleInput).min(1),
});

export type LessonInput = z.infer<typeof LessonInput>;
export type ModuleInput = z.infer<typeof ModuleInput>;
export type CourseInput = z.infer<typeof CourseInput>;

export type Issue = { where: string; problem: string };

const PLACEHOLDER = /welcome to lesson|lorem ipsum|\btodo\b|\btbd\b|coming soon/i;

/**
 * Гейт публікації. Одна причина пояснює вісім із дванадцяти контентних
 * дефектів конкурента: у них цього гейту немає. Урок, який його не пройшов,
 * не потрапляє в базу — і не потрапляє на очі оплаченому користувачу.
 */
export function checkLesson(lesson: LessonInput, where: string): Issue[] {
  const issues: Issue[] = [];
  const add = (problem: string) => issues.push({ where, problem });

  const words = countWords(lesson.blocks);
  if (words < 400) add(`замало тексту: ${words} слів, треба від 400`);
  if (words > 1400) add(`забагато тексту: ${words} слів, треба до 1400`);

  if (lesson.blocks.length < 8) add(`${lesson.blocks.length} блоків, треба від 8`);
  if (lesson.blocks.length > 14) add(`${lesson.blocks.length} блоків, треба до 14`);

  // Заявлений час має відповідати обсягу: ~180 слів на хвилину читання
  // плюс запас на вправи. Інакше «6 Minutes» на 560 слів, як у конкурента.
  const realistic = Math.max(3, Math.round(words / 180) + 2);
  if (Math.abs(lesson.durationMin - realistic) > 3) {
    add(`тривалість ${lesson.durationMin} хв не відповідає обсягу (${words} слів ≈ ${realistic} хв)`);
  }

  for (const block of lesson.blocks) {
    if (block.type === "text" && countWords([block]) > 110) {
      add(`текстовий блок «${block.heading ?? block.id}» довший за 110 слів`);
    }

    if (isQuiz(block)) {
      const lengths = block.options.map((o) => o.label.length);
      const longest = Math.max(...lengths);
      const shortest = Math.min(...lengths);
      // Стабільна слабкість конкурента: правильна відповідь завжди найдовша,
      // і уважний читач вгадує її, не читаючи питання.
      if (longest > shortest * 1.4) {
        add(`квіз «${truncate(block.question)}»: варіанти різної довжини — відповідь видно на око`);
      }
      if (!block.options.some((o) => o.id === block.correctId)) {
        add(`квіз «${truncate(block.question)}»: correctId не збігається з жодним варіантом`);
      }
    }
  }

  if (!lesson.blocks.some((b) => b.type === "summary")) add("немає підсумкового блоку");
  if (!lesson.blocks.some(isQuiz)) add("немає жодного квізу");

  const plain = lesson.blocks
    .map((b) => (b.type === "text" ? stripHtml(b.bodyHtml) : JSON.stringify(b)))
    .join(" ");
  if (PLACEHOLDER.test(plain)) add("у тексті лишилася заглушка");

  const ids = lesson.blocks.map((b) => b.id);
  if (new Set(ids).size !== ids.length) add("повторюються id блоків");

  return issues;
}

export function checkCourse(course: CourseInput): Issue[] {
  const issues: Issue[] = [];
  const titles = new Set<string>();

  for (const module of course.modules) {
    for (const [index, lesson] of module.lessons.entries()) {
      const where = `${course.slug}/${module.slug}/${lesson.slug}`;

      // Дубльовані назви уроків — реальний дефект у каталозі конкурента.
      const key = `${module.slug}::${lesson.title.toLowerCase()}`;
      if (titles.has(key)) issues.push({ where, problem: "назва уроку дублюється в цьому юніті" });
      titles.add(key);

      issues.push(...checkLesson(lesson, where));
      void index;
    }
  }

  const slugs = course.modules.map((m) => m.slug);
  if (new Set(slugs).size !== slugs.length) {
    issues.push({ where: course.slug, problem: "повторюються слаги юнітів" });
  }

  return issues;
}

/** Юніти без жодного уроку не синхронізуються: краще коротший план, ніж порожні картки. */
export function publishableModules(course: CourseInput): ModuleInput[] {
  return course.modules.filter((m) => m.lessons.length > 0);
}

function truncate(value: string, max = 40) {
  return value.length > max ? `${value.slice(0, max)}…` : value;
}
