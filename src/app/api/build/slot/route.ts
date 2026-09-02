import type { NextRequest } from "next/server";
import { z } from "zod";
import { fail, ok, toResponse } from "@/core/http/envelope";
import { requireActiveAccess } from "@/core/auth/guards";
import { clearSlot, fillSlot } from "@/core/build/service";

const Input = z.object({
  slotId: z.string().min(1),
  action: z.enum(["fill", "clear"]),
  note: z.string().max(300).trim().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireActiveAccess();

    const parsed = Input.safeParse(await req.json());
    if (!parsed.success) return fail("validation_failed");
    const { slotId, action, note } = parsed.data;

    const result =
      action === "fill"
        ? await fillSlot(user.id, slotId, note && note.length > 0 ? note : null)
        : await clearSlot(user.id, slotId);

    if (!result.ok) return fail("not_found");
    return ok({ slotId, filled: action === "fill" });
  } catch (error) {
    return toResponse(error);
  }
}
