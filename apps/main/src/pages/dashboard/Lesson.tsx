import { useLoaderData } from "react-router";
import type { getLessonForUser } from "@aishka/core/progress/service";
import { Player } from "@/components/lesson/Player";
import { useTitle } from "@aishka/ui/title";

export type LessonView = NonNullable<Awaited<ReturnType<typeof getLessonForUser>>>["lesson"];

export function Lesson() {
  const lesson = useLoaderData() as LessonView;
  useTitle(`${lesson.title} · AIshka`);

  return (
    // key: новий слаг — новий плеєр, інакше позиція й відповіді їдуть за людиною в наступний урок.
    <Player
      key={lesson.slug}
      slug={lesson.slug}
      title={lesson.title}
      unitTitle={lesson.unitTitle}
      blocks={lesson.blocks}
      nextLessonSlug={lesson.nextLessonSlug}
    />
  );
}
