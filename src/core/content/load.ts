import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { CourseInput, checkCourse, type Issue } from "./course";

const DIR = join(process.cwd(), "content", "courses");

export type LoadedCourse = { file: string; course: CourseInput };

export function loadCourses(): { courses: LoadedCourse[]; issues: Issue[] } {
  const files = readdirSync(DIR).filter((f) => f.endsWith(".json"));
  const courses: LoadedCourse[] = [];
  const issues: Issue[] = [];

  for (const file of files) {
    const raw: unknown = JSON.parse(readFileSync(join(DIR, file), "utf8"));
    const parsed = CourseInput.safeParse(raw);

    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        issues.push({ where: `${file}:${issue.path.join(".")}`, problem: issue.message });
      }
      continue;
    }

    courses.push({ file, course: parsed.data });
    issues.push(...checkCourse(parsed.data));
  }

  return { courses, issues };
}
