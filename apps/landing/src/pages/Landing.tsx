import { Link, useLoaderData } from "react-router";
import { Button, Card, GeneratedCover } from "@aishka/ui/primitives";
import { useTitle } from "@aishka/ui/title";
import { MAIN_URL } from "@/config";

export type LandingCourse = {
  id: string;
  slug: string;
  title: string;
  description: string;
  units: number;
};

export function Landing() {
  useTitle("AIshka");
  const courses = useLoaderData() as LandingCourse[];

  return (
    <main className="mx-auto w-full max-w-[1080px] px-5 py-14">
      <section className="mb-14 max-w-[640px]">
        <h1 className="mb-4 text-[40px] font-bold leading-[1.05] tracking-tight text-ink-strong text-balance sm:text-[52px]">
          Stop collecting AI tips. Get your first paid project.
        </h1>
        <p className="mb-8 text-[18px] leading-relaxed text-ink-body">
          Answer six questions and get a plan built around what you want to sell, how much time you
          have, and what&apos;s actually stopping you. Short lessons, real examples, one step at a time.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link to="/register">
            <Button>Build my plan</Button>
          </Link>
          {/* Вхід — на платформі: тут лише ті, хто ще не з нами. */}
          <a href={`${MAIN_URL}/login`}>
            <Button variant="ghost">Sign in</Button>
          </a>
        </div>
      </section>

      {courses.length > 0 ? (
        <section>
          <h2 className="mb-4 text-[24px] font-semibold text-ink-strong">What&apos;s inside</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <Card key={course.id} className="overflow-hidden">
                <GeneratedCover seed={course.slug} className="aspect-[16/9]" />
                <div className="p-4">
                  <h3 className="mb-1.5 text-[20px] font-semibold leading-snug text-ink-strong">
                    {course.title}
                  </h3>
                  <p className="mb-3 text-[14px] leading-relaxed text-ink-muted">
                    {course.description}
                  </p>
                  <p className="text-[13px] text-ink-muted">
                    {course.units} {course.units === 1 ? "unit" : "units"}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
