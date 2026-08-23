import { z } from "zod";

export const emailField = z
  .string()
  .min(1, "Enter your email")
  .email("That doesn't look like an email")
  .transform((s) => s.toLowerCase().trim());

// Мінімум 8 символів і жодних вимог «велика літера + цифра + символ»:
// такі правила дають гірші паролі, а не кращі.
export const passwordField = z
  .string()
  .min(8, "At least 8 characters")
  .max(200, "That password is too long");

export const RegisterInput = z.object({
  firstName: z.string().min(1, "Enter your first name").max(60).trim(),
  email: emailField,
  password: passwordField,
});

export const LoginInput = z.object({
  email: emailField,
  password: z.string().min(1, "Enter your password").max(200),
});

export type RegisterInput = z.infer<typeof RegisterInput>;
export type LoginInput = z.infer<typeof LoginInput>;

/** Помилки zod → мапа «поле → перше повідомлення» для форми. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    out[key] ??= issue.message;
  }
  return out;
}
