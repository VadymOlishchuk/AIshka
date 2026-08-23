import type { NextRequest } from "next/server";
import { z } from "zod";
import { fail, ok, toResponse } from "@/core/http/envelope";
import { ipOf } from "@/core/http/request";
import { rateLimit } from "@/core/auth/rate-limit";
import { emailField, fieldErrors } from "@/core/auth/schemas";
import { issuePasswordToken } from "@/core/auth/password-reset";

const Input = z.object({ email: emailField });

export async function POST(req: NextRequest) {
  try {
    const parsed = Input.safeParse(await req.json());
    if (!parsed.success) return fail("validation_failed", { fields: fieldErrors(parsed.error) });

    const gate = await rateLimit(
      [`forgot:ip:${ipOf(req)}`, `forgot:acc:${parsed.data.email}`],
      { limit: 3, windowSec: 3600 },
    );
    if (!gate.allowed) {
      return fail("rate_limited", { headers: { "Retry-After": String(gate.retryAfter) } });
    }

    await issuePasswordToken(parsed.data.email, "reset");

    // Завжди 200 з тим самим текстом, існує акаунт чи ні.
    return ok({ sent: true });
  } catch (error) {
    return toResponse(error);
  }
}
