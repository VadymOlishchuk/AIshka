import { requireActiveAccess } from "@/core/auth/guards";
import { getAcademyCatalog } from "@/core/progress/service";
import { CourseCard } from "@/components/dashboard/CourseCard";
import { LibraryHero } from "@/components/dashboard/LibraryHero";
import { Card } from "@/components/ui/primitives";

// Порядок полиць фіксований: професії першими, бо це найширший вхід у каталог.
const SHELF_ORDER = ["Careers", "Text", "Images", "Agents", "Challenges", "Tool courses"];

/**
 * Полиця без пояснення — просто слово над рядом плиток, і людина сама вгадує,
 * чим «Text» відрізняється від «Tool courses». Один рядок під заголовком знімає
 * це питання, тому опис тут обов'язковий, а не оздоблення.
 */
const SHELF_NOTE: Record<string, string> = {
  Careers: "Pick the job you're aiming at and learn the AI work that actually gets paid for in it.",
  Text: "Writing, editing and selling words — the fastest skill to charge money for.",
  Images: "Make and fix visuals without a studio, a camera or a designer on call.",
  Agents: "What an agent really is, and where it beats a plain chat window.",
  Challenges: "Short runs with a date and one outcome at the end.",
  "Tool courses": "One tool at a time: what it's good at, and where it falls apart.",
};

export default async function AcademyPage() {
  const user = await requireActiveAccess();
  const courses = await getAcademyCatalog(user.id);

  // Полиці — динамічні добірки над форматами, а не окремі сутності.
  const shelves = new Map<string, typeof courses>();
  for (const course of courses) {
    const key = course.shelf ?? "Everything else";
    shelves.set(key, [...(shelves.get(key) ?? []), course]);
  }

  const names = [...shelves.keys()].sort((a, b) => {
    const ai = SHELF_ORDER.indexOf(a);
    const bi = SHELF_ORDER.indexOf(b);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi) || a.localeCompare(b);
  });

  // Рівно один очевидний наступний крок на всю сторінку, а не по одному на
  // полицю: шість підсвічених карток — це вже не підказка, а шум.
  const continueId = courses.find((c) => c.completed > 0 && c.completed < c.lessons)?.id ?? null;

  return (
    <main className="mx-auto w-full max-w-[1100px] px-5 py-8">
      <LibraryHero firstName={user.firstName} courses={courses} />

      {courses.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-[15px] text-ink-muted">
            No courses published yet. Your build is where to start.
          </p>
        </Card>
      ) : (
        names.map((shelf) => {
          const items = shelves.get(shelf) ?? [];
          return (
            <section key={shelf} className="mb-12 last:mb-0">
              <div className="mb-4">
                <div className="mb-1.5 flex items-baseline gap-2.5">
                  <h2 className="text-[24px] text-ink-strong">{shelf}</h2>
                  <span className="text-[15px] font-bold tabular-nums text-ink-muted/70">
                    {items.length}
                  </span>
                </div>
                <p className="max-w-[62ch] text-[14.5px] leading-relaxed text-ink-muted">
                  {SHELF_NOTE[shelf] ?? "Courses that didn't fit the shelves above."}
                </p>
              </div>

              {/*
                Ряд в один рядок з горизонтальною прокруткою. Негативні поля дають
                йому дійти до краю екрана — так видно, що праворуч є продовження,
                а не що ряд обрізали. Нижній відступ тримає кольорову тінь картки,
                яку overflow інакше зрізав би, і компенсується від'ємним полем.
              */}
              <ul className="-mx-5 -mb-6 flex snap-x gap-4 overflow-x-auto px-5 pb-12 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {items.map((course, index) => (
                  <li key={course.id} className="w-[344px] flex-none snap-start">
                    <CourseCard
                      course={course}
                      highlighted={course.id === continueId}
                      index={index}
                    />
                  </li>
                ))}
              </ul>
            </section>
          );
        })
      )}
    </main>
  );
}
