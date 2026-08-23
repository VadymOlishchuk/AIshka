import { z } from "zod";

/**
 * Блоки уроку. Ця схема — одночасно тип для плеєра і гейт публікації:
 * урок, який її не проходить, не потрапляє в базу. Саме відсутність такого
 * гейту зіпсувала половину каталогу конкурента.
 */

const blockId = z.string().min(1).max(40);

export const VideoBlock = z.object({
  id: blockId,
  type: z.literal("video"),
  provider: z.literal("youtube"),
  videoId: z.string().min(5, "Порожній відео-слот — блок треба або заповнити, або прибрати"),
  description: z.string().min(1),
});

export const TextBlock = z.object({
  id: blockId,
  type: z.literal("text"),
  heading: z.string().max(120).optional(),
  bodyHtml: z.string().min(1),
});

export const ImageBlock = z.object({
  id: blockId,
  type: z.literal("image"),
  url: z.string().min(1),
  alt: z.string().min(1, "alt обов'язковий: без нього зображення не існує для читача з екранним диктором"),
});

export const QuoteBlock = z.object({
  id: blockId,
  type: z.literal("quote"),
  text: z.string().min(1).max(280),
});

export const TryBlock = z.object({
  id: blockId,
  type: z.literal("try"),
  heading: z.string().min(1),
  items: z.array(z.string().min(1)).min(2).max(6),
});

export const QuizBlock = z.object({
  id: blockId,
  type: z.literal("quiz"),
  variant: z.enum(["single", "boolean"]),
  question: z.string().min(1),
  options: z.array(z.object({ id: z.string().min(1), label: z.string().min(1) })).min(2).max(4),
  correctId: z.string().min(1),
  successTitle: z.string().min(1),
  // Пояснення повторює тезу, а не хвалить: «Молодець!» нічого не додає.
  successBody: z.string().min(20),
  // Підказка вказує напрямок думки, а не правильну відповідь.
  wrongHint: z.string().min(20),
});

export const AiTaskBlock = z.object({
  id: blockId,
  type: z.literal("ai_task"),
  variant: z.literal("match_pairs"),
  cardKind: z.enum(["text", "image"]),
  title: z.string().min(1),
  subtitle: z.string().min(1),
  pairs: z
    .array(
      z.object({
        left: z.object({ text: z.string().optional(), image: z.string().optional(), label: z.string().optional() }),
        right: z.object({ text: z.string().min(1) }),
      }),
    )
    .length(3, "Рівно 3 пари: більше втомлює на телефоні"),
  failHint: z.string().min(10),
  optional: z.literal(true),
});

export const SummaryBlock = z.object({
  id: blockId,
  type: z.literal("summary"),
  body: z.string().min(1),
  nextTeaser: z.string().min(1, "Тізер наступного уроку тримає ланцюжок навчання"),
});

export const Block = z.discriminatedUnion("type", [
  VideoBlock,
  TextBlock,
  ImageBlock,
  QuoteBlock,
  TryBlock,
  QuizBlock,
  AiTaskBlock,
  SummaryBlock,
]);

export type Block = z.infer<typeof Block>;
export type QuizBlock = z.infer<typeof QuizBlock>;
export type TextBlock = z.infer<typeof TextBlock>;
export type AiTaskBlock = z.infer<typeof AiTaskBlock>;

export function isQuiz(block: Block): block is QuizBlock {
  return block.type === "quiz";
}

/** Слова рахуємо по видимому тексту — саме він визначає час читання. */
export function countWords(blocks: Block[]): number {
  const text = blocks
    .map((b) => {
      switch (b.type) {
        case "text":
          return `${b.heading ?? ""} ${stripHtml(b.bodyHtml)}`;
        case "quote":
          return b.text;
        case "try":
          return `${b.heading} ${b.items.join(" ")}`;
        case "quiz":
          return `${b.question} ${b.options.map((o) => o.label).join(" ")} ${b.successBody}`;
        case "summary":
          return `${b.body} ${b.nextTeaser}`;
        case "video":
          return b.description;
        default:
          return "";
      }
    })
    .join(" ");

  return text.split(/\s+/).filter(Boolean).length;
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ");
}
