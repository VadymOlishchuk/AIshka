import type { CatalogCourse } from "@aishka/core/progress/service";
import { CourseCard } from "@/components/dashboard/CourseCard";

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

/**
 * Полиці каталогу. Стоять і на головній, і в бібліотеці — тому це компонент,
 * а не тіло сторінки: дві копії розійшлися б після першої ж правки.
 */
export function CourseShelves({ courses }: { courses: CatalogCourse[] }) {
  // Полиці — динамічні добірки над форматами, а не окремі сутності.
  const shelves = new Map<string, CatalogCourse[]>();
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
    <>
      {names.map((shelf) => {
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
              Ряд в один рядок з горизонтальною прокруткою. Стрічка стоїть у
              контейнері, тому перша картка починається рівно там, де заголовок
              полиці. Від'ємні поля «до краю екрана» тут були: паддинг усередині
              прокрутки не спрацьовував, і перша картка липла до лівого краю.
              Нижній відступ тримає кольорову тінь картки, яку overflow інакше
              зрізав би, і компенсується від'ємним полем.
            */}
            <ul className="-mb-6 flex snap-x gap-4 overflow-x-auto pb-12 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {items.map((course, index) => (
                <li key={course.id} className="w-[344px] flex-none snap-start">
                  <CourseCard course={course} highlighted={course.id === continueId} index={index} />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </>
  );
}
