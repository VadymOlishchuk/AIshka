import { Link, useLoaderData } from "react-router";
import { duration, plural } from "@aishka/core/format";
import { Button, Card, IconTile } from "@aishka/ui/primitives";
import { useTitle } from "@aishka/ui/title";

export type ReadyView = {
  courseTitle: string;
  units: { id: string; slug: string; title: string; icon: string | null }[];
  lessons: number;
  minutes: number;
  why: string | null;
};

export function PlanReady() {
  useTitle("Your plan is ready · AIshka");
  const view = useLoaderData() as ReadyView;

  return (
    <main className="mx-auto w-full max-w-[620px] px-5 py-12">
      <p className="mb-2 text-[14px] font-semibold uppercase tracking-wider text-accent">
        Your plan is ready
      </p>
      <h1 className="mb-3 text-[32px] font-semibold leading-tight text-ink-strong text-balance">
        {view.courseTitle}
      </h1>
      <p className="mb-6 text-[17px] leading-relaxed text-ink-body">
        {plural(view.units.length, "unit", "units")} · {plural(view.lessons, "lesson", "lessons")} ·
        about {duration(view.minutes)}
      </p>

      {view.why ? (
        <p className="mb-7 rounded-[10px] bg-accent-tint px-4 py-3 text-[15px] leading-relaxed text-ink-strong">
          {view.why}
        </p>
      ) : null}

      <div className="mb-8 flex flex-col gap-3">
        {view.units.slice(0, 3).map((unit, i) => (
          <Card key={unit.id} className="flex items-center gap-4 overflow-hidden p-3">
            <IconTile icon={unit.icon} seed={unit.slug} size="text-[28px]" className="h-16 w-16 flex-none" />
            <div className="min-w-0">
              <p className="text-[12px] font-semibold uppercase tracking-wider text-ink-muted">
                Unit {i + 1}
              </p>
              <p className="text-[17px] font-semibold leading-snug text-ink-strong">{unit.title}</p>
            </div>
          </Card>
        ))}
      </div>

      <Link to="/dashboard">
        <Button className="w-full">Start learning</Button>
      </Link>
    </main>
  );
}
