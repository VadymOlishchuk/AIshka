import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { clearSlot, fillSlot, getBuild } from "@aishka/core/build/service";
import { requireAccessOf } from "../lib/auth";

const SlotInput = z.object({
  slotId: z.string().min(1),
  action: z.enum(["fill", "clear"]),
  note: z.string().max(300).trim().optional(),
});

export const buildRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", async (req, reply) => {
    const user = await requireAccessOf(req);
    const build = await getBuild(user.id);
    if (!build) return reply.fail("not_found");
    return reply.ok(build);
  });

  app.post("/slot", async (req, reply) => {
    const user = await requireAccessOf(req);

    const parsed = SlotInput.safeParse(req.body);
    if (!parsed.success) return reply.fail("validation_failed");
    const { slotId, action, note } = parsed.data;

    const result =
      action === "fill"
        ? await fillSlot(user.id, slotId, note && note.length > 0 ? note : null)
        : await clearSlot(user.id, slotId);

    if (!result.ok) return reply.fail("not_found");
    return reply.ok({ slotId, filled: action === "fill" });
  });
};
