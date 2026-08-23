import { db } from "@/lib/db";
import { ok, fail, toResponse } from "@/core/http/envelope";
import { requireActiveAccess } from "@/core/auth/guards";
import { completeLesson, getLessonForUser } from "@/core/progress/service";

export async function POST(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const user = await requireActiveAccess();
    const { slug } = await params;

    const found = await getLessonForUser(user.id, slug);
    if (!found) return fail("not_found");
    if (found.locked) return fail("forbidden", { message: "Finish the previous lesson first." });

    await completeLesson(user.id, found.lesson.id, found.lesson.courseId);

    const total = await db.progress.count({
      where: { userId: user.id, courseId: found.lesson.courseId },
    });

    return ok({ completed: true, completedLessons: total });
  } catch (error) {
    return toResponse(error);
  }
}
