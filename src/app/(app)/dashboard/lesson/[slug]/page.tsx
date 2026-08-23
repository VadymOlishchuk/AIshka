import { notFound, redirect } from "next/navigation";
import { requireActiveAccess } from "@/core/auth/guards";
import { getLessonForUser } from "@/core/progress/service";
import { Player } from "@/components/lesson/Player";

export default async function LessonPage({ params }: { params: Promise<{ slug: string }> }) {
  const user = await requireActiveAccess();
  const { slug } = await params;

  // Тіла блоків віддаються тільки після перевірки доступу — приховати
  // кнопку в інтерфейсі недостатньо, каталог викачується скриптом.
  const found = await getLessonForUser(user.id, slug);
  if (!found) notFound();
  if (found.locked) redirect("/dashboard/journey");

  return (
    <Player
      slug={found.lesson.slug}
      title={found.lesson.title}
      unitTitle={found.lesson.unitTitle}
      blocks={found.lesson.blocks}
      nextLessonSlug={found.lesson.nextLessonSlug}
    />
  );
}
