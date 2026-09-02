import Image from "next/image";
import { EMOJI_ASSETS } from "@/lib/emoji-assets";

/** Кодпоінти без селектора варіації й ZWJ — так називаються файли в public/emoji. */
export function codepointsOf(symbol: string): string {
  return [...symbol]
    .filter((c) => c !== "️" && c !== "‍")
    .map((c) => c.codePointAt(0)!.toString(16))
    .join("-");
}

/**
 * Значок курсу або юніта. Системні емодзі малюються по-різному на macOS,
 * Windows і Android і читаються як заглушка, тому замість шрифту віддаємо
 * об'ємний малюнок із набору Fluent Emoji (Microsoft, ліцензія MIT).
 *
 * Двох значків у наборі немає — «✍️» (є лише пласка версія) і «✦» (це взагалі
 * не емодзі, а типографський знак). Для них лишається текст: краще один
 * акуратний символ, ніж порожнє місце.
 */
export function Emoji({
  symbol,
  className = "",
  fallbackSize = "text-[28px]",
}: {
  symbol?: string | null;
  className?: string;
  fallbackSize?: string;
}) {
  if (!symbol) return null;

  const cp = codepointsOf(symbol);
  if (!EMOJI_ASSETS.has(cp)) {
    return (
      <span aria-hidden className={`${fallbackSize} leading-none`}>
        {symbol}
      </span>
    );
  }

  // Розмір задає className: 256 тут — лише вихідна щільність для оптимізатора.
  return (
    <Image src={`/emoji/${cp}.png`} alt="" width={256} height={256} className={className} />
  );
}
