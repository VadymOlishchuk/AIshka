import { Link, useLoaderData } from "react-router";
import type { BuildView } from "@aishka/core/build/service";
import type { CatalogCourse } from "@aishka/core/progress/service";
import { Button, Card, Pill } from "@aishka/ui/primitives";
import type { Me } from "@aishka/ui/api";
import { useTitle } from "@aishka/ui/title";
import { CourseShelves } from "@/components/dashboard/CourseShelves";

/**
 * Головна: угорі — що людина отримає в кінці (збірка), нижче — весь каталог
 * полицями. Обіцянка й спосіб її виконати стоять на одному екрані, тому після
 * реєстрації не треба вгадувати, куди йти далі.
 *
 * Панель збірки тут навмисно компактна: вона задає напрямок, а не забирає
 * перший екран. Розгорнутий вигляд зі слотами живе на /build.
 */
export function Home() {
  useTitle("Home · AIshka");
  const { me, build, courses } = useLoaderData() as {
    me: Me;
    build: BuildView | null;
    courses: CatalogCourse[];
  };

  return (
    <main className="mx-auto w-full max-w-[1100px] px-5 py-8">
      <h1 className="mb-6 text-[30px] font-extrabold leading-[1.1] tracking-[-0.03em] text-ink-strong">
        Welcome, {me.firstName}
      </h1>

      {build ? <BuildStrip build={build} /> : null}

      {courses.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-[15px] text-ink-muted">
            No courses published yet. Your build is where to start.
          </p>
        </Card>
      ) : (
        <CourseShelves courses={courses} />
      )}
    </main>
  );
}

/**
 * Збірка одним рядком: обіцянка, скільки з неї вже зібрано і що робити далі.
 * Одна темна панель на сторінку — це правило колірної системи, тому нижче
 * полиці лишаються світлими.
 */
function BuildStrip({ build }: { build: BuildView }) {
  const percent = build.total > 0 ? Math.round((build.filled / build.total) * 100) : 0;

  return (
    <section className="mb-12 overflow-hidden rounded-[24px] bg-ink-panel p-6 text-white sm:p-7">
      <div className="gap-7 sm:flex sm:items-center">
        <div className="min-w-0 flex-1">
          <Pill tone="onDark" className="uppercase tracking-[.09em]">
            What you walk away with
          </Pill>

          <h2 className="mb-2 mt-4 text-[22px] font-extrabold leading-[1.15] text-balance sm:text-[25px]">
            {build.title}
          </h2>
          {/* Обіцянка коротшає до двох рядків: тут вона орієнтир, а не опис. */}
          <p className="line-clamp-2 max-w-[58ch] text-[14px] leading-relaxed text-muted-on-dark">
            {build.outcome}
          </p>

          <div className="mt-5 flex items-center gap-3">
            <span className="h-1.5 w-full max-w-[220px] overflow-hidden rounded-full bg-white/15">
              <span
                className="block h-full rounded-full bg-white transition-[width] duration-500"
                style={{ width: `${percent === 0 ? 3 : percent}%` }}
              />
            </span>
            <p className="flex-none text-[13px] tabular-nums text-muted-on-dark">
              <span className="font-bold text-white">
                {build.filled}/{build.total}
              </span>{" "}
              artifacts
            </p>
          </div>

          {/* Наступний крок і дія — в один рядок: на панелі лише одна кнопка. */}
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
            {build.next ? (
              <p className="min-w-0 text-[13px] text-muted-on-dark">
                Next · {build.next.stageTitle} · {build.next.minutes} min
                <span className="ml-2 font-bold text-white">{build.next.title}</span>
              </p>
            ) : null}

            <Link to="/build" className="ml-auto max-sm:w-full">
              <Button variant="onDark" className="max-sm:w-full">
                {build.next ? "Open the build" : "See the build"}
              </Button>
            </Link>
          </div>
        </div>

        {build.coverUrl ? (
          <img
            src={build.coverUrl}
            alt=""
            width={600}
            height={600}
            className="mt-7 hidden w-[168px] flex-none rounded-[16px] object-cover sm:mt-0 sm:block"
          />
        ) : null}
      </div>
    </section>
  );
}
