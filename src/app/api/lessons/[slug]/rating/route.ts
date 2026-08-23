import type { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { fail, ok, toResponse } from "@/core/http/envelope";
import { requireActiveAccess } from "@/core/auth/guards";

const Input = z.object({
  stars: z.number().int().min(1).max(5),
  comment: z.string().max(1000).trim().optional(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const user = await requireActiveAccess();
    const { slug } = await params;

    const parsed = Input.safeParse(await req.json());
    if (!parsed.success) return fail("validation_failed");

    const lesson = await db.lesson.findUnique({ where: { slug }, select: { id: true } });
    if (!lesson) return fail("not_found");

    // Одна оцінка на урок: повторна відправка з коментарем оновлює попередню.
    await db.lessonRating.upsert({
      where: { userId_lessonId: { userId: user.id, lessonId: lesson.id } },
      create: { userId: user.id, lessonId: lesson.id, ...parsed.data },
      update: parsed.data,
    });

    return ok({ saved: true });
  } catch (error) {
    return toResponse(error);
  }
}
