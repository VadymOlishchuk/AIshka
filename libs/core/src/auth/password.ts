import { randomBytes } from "node:crypto";
import { hash, verify } from "@node-rs/argon2";

// Профіль OWASP для argon2id: 19 МіБ пам'яті, 2 ітерації, паралелізм 1.
// algorithm не вказуємо — argon2id тут і так за замовчуванням.
const OPTIONS = {
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
} as const;

export function hashPassword(plain: string): Promise<string> {
  return hash(plain, OPTIONS);
}

/**
 * Акаунт без пароля (створений на лендінгу, оплата ще не завершена) не входить
 * ніколи — але перевірка все одно коштує стільки ж, скільки справжня.
 */
export async function verifyPassword(hashed: string | null, plain: string): Promise<boolean> {
  if (!hashed) {
    await verify(await getDummyHash(), plain).catch(() => false);
    return false;
  }
  return verify(hashed, plain).catch(() => false);
}

/**
 * Хеш неіснуючого пароля. Потрібен, щоб вхід із незнайомим email витрачав
 * стільки ж часу, скільки вхід із існуючим: інакше різниця у часі відповіді
 * видає, які адреси зареєстровані. Рахуємо один раз на процес — це має бути
 * справжній argon2-хеш, інакше перевірка провалиться миттєво й сенс зникне.
 */
let dummyHash: Promise<string> | null = null;

export function getDummyHash(): Promise<string> {
  dummyHash ??= hashPassword(randomBytes(24).toString("hex"));
  return dummyHash;
}
