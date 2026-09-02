import Image from "next/image";
import Link from "next/link";
import { ClockIcon, LessonsIcon } from "@/components/ui/icons";
import { Emoji } from "@/components/ui/emoji";
import { duration, plural } from "@/lib/format";
import type { CatalogCourse } from "@/core/progress/service";

/**
 * Картка курсу: біла, а всередині неї — кольорова підкладка з відступом від
 * країв. Саме відступ робить картку карткою: підкладка лежить у ній, а не
 * приклеєна до країв двома злиплими блоками.
 *
 * Підвал білий і без своєї заливки: він частина картки, а не третій блок.
 *
 * Поля пастельні й беруться з фіксованого набору за слагом — не випадковий
 * відтінок з усього кола, інакше полиця стає веселкою. Насиченість низька, тому
 * жоден із них не сперечається з індиго: індиго лишається єдиною дією на сторінці,
 * а колір поля лише розводить сусідні картки, щоб їх не плутали.
 */
const FIELDS = ["#EFE9FE", "#DEEDFB", "#DCF3E7", "#FDECDD", "#FBE4EC", "#FAF3D6"];

function fieldOf(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return FIELDS[hash % FIELDS.length];
}

const KIND_SHORT: Record<string, string> = {
  career: "Career",
  tool: "Tool",
  challenge: "Challenge",
  mini: "Mini course",
};

export function CourseCard({
  course,
  highlighted,
  index,
}: {
  course: CatalogCourse;
  highlighted: boolean;
  index: number;
}) {
  const percent = course.lessons > 0 ? Math.round((course.completed / course.lessons) * 100) : 0;
  const done = course.lessons > 0 && course.completed === course.lessons;
  const started = course.completed > 0 && !done;

  const tag = done ? "Finished" : started ? "In progress" : (KIND_SHORT[course.kind] ?? "Course");
  const action = done ? "Review" : started ? "Continue" : "Start";

  return (
    <Link
      href={`/dashboard/course/${course.slug}`}
      style={{ animationDelay: `${Math.min(index, 11) * 35}ms` }}
      className={`rise group flex h-full flex-col rounded-[24px] border bg-surface p-2.5 shadow-[0_14px_40px_rgba(18,20,43,.08)] transition duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 hover:shadow-[0_22px_50px_rgba(18,20,43,.13)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
        highlighted ? "border-accent" : "border-[rgba(18,20,43,.06)]"
      }`}
    >
      {/* Підкладка: ярлик, назва, опис, метадані й прогрес — усе всередині неї. */}
      <div
        className="relative flex-1 overflow-hidden rounded-[17px] p-5"
        style={{ backgroundColor: fieldOf(course.slug) }}
      >
        {/*
          Ілюстрація завжди в одному місці: позицію задає контейнер, а не кожна
          гілка окремо. Раніше обкладинка стояла на right-5, а значок на right-4,
          і значок підходив до краю ближче за картинку — та сама картка виглядала
          по-різному залежно від того, що в ній лежить.

          Щільний PNG (абакус) заповнює свій кадр повністю, на відміну від
          обкладинки зі скругленням, тому 20px тут — мінімум, менше вже читається
          як притиснуто до краю.
        */}
        {course.coverUrl || course.icon ? (
          <span
            aria-hidden
            className="pointer-events-none absolute right-5 top-5 flex h-[92px] w-[92px] items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:-translate-y-1 group-hover:scale-[1.06]"
          >
            {course.coverUrl ? (
              <Image
                src={course.coverUrl}
                alt=""
                width={200}
                height={200}
                className="h-full w-full rounded-[18px] object-cover"
              />
            ) : (
              <Emoji
                symbol={course.icon}
                className="h-full w-full object-contain"
                fallbackSize="text-[76px]"
              />
            )}
          </span>
        ) : null}

        <span className="inline-flex items-center rounded-full bg-surface/70 px-3 py-1 text-[12px] font-bold text-ink-strong">
          {tag}
        </span>

        {/* pr тримає текст лівіше за значок, щоб довга назва не лізла під нього. */}
        <h3 className="mt-5 pr-24 text-[21px] font-extrabold leading-[1.15] tracking-[-0.025em] text-ink-strong">
          {course.title}
        </h3>

        <p className="mt-2 line-clamp-2 pr-24 text-[13.5px] leading-[1.5] text-ink-strong/60">
          {course.description}
        </p>

        <div className="mt-5 flex items-center gap-3 text-[13px] font-semibold tabular-nums text-ink-strong/70">
          <span className="flex items-center gap-1.5">
            <LessonsIcon className="h-[15px] w-[15px] flex-none" />
            {plural(course.lessons, "lesson", "lessons")}
          </span>
          <span aria-hidden className="text-ink-strong/25">
            •
          </span>
          <span className="flex items-center gap-1.5">
            <ClockIcon className="h-[15px] w-[15px] flex-none" />
            {duration(course.minutes)}
          </span>
        </div>

        <div className="mt-6">
          <div className="mb-2 flex items-baseline justify-between text-[13px] font-semibold">
            <span className="text-ink-strong/60">Progress</span>
            <span className="tabular-nums text-ink-strong">{percent}%</span>
          </div>
          {/* Трек білий, а не сірий: на кольоровому полі сірий брудниться. */}
          <span className="block h-1.5 w-full overflow-hidden rounded-full bg-surface/70">
            <span
              className="block h-full rounded-full bg-accent transition-[width] duration-500"
              style={{ width: `${percent === 0 ? 3 : percent}%` }}
            />
          </span>
        </div>
      </div>

      {/* Білий підвал: ліворуч факт, праворуч єдина дія. */}
      <div className="flex items-center justify-between gap-3 px-[18px] pb-1.5 pt-4">
        <p className="text-[13.5px] tabular-nums text-ink-muted">
          {started || done ? (
            <>
              Lessons:{" "}
              <span className="font-bold text-ink-strong">
                {course.completed}/{course.lessons}
              </span>
            </>
          ) : (
            <>
              Duration: <span className="font-bold text-ink-strong">{duration(course.minutes)}</span>
            </>
          )}
        </p>

        <span className="rounded-full bg-ink-strong px-6 py-3 text-[13.5px] font-bold text-white transition group-hover:bg-accent">
          {action}
        </span>
      </div>
    </Link>
  );
}
