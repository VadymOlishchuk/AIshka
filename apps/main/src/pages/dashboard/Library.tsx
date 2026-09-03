import { useLoaderData, useRouteLoaderData } from "react-router";
import type { CatalogCourse } from "@aishka/core/progress/service";
import { CourseShelves } from "@/components/dashboard/CourseShelves";
import { LibraryHero } from "@/components/dashboard/LibraryHero";
import { Card } from "@aishka/ui/primitives";
import type { Me } from "@aishka/ui/api";
import { useTitle } from "@aishka/ui/title";

export function Library() {
  useTitle("Library · AIshka");
  const courses = useLoaderData() as CatalogCourse[];
  const me = useRouteLoaderData("dashboard") as Me;

  return (
    <main className="mx-auto w-full max-w-[1100px] px-5 py-8">
      <LibraryHero firstName={me.firstName} courses={courses} />

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
