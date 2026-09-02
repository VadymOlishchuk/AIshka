import { loadCourses } from "../libs/core/src/content/load";
import { publishableModules } from "../libs/core/src/content/course";
import { countWords } from "../libs/core/src/content/blocks";

const { courses, issues } = loadCourses();

for (const { course } of courses) {
  const ready = publishableModules(course);
  const lessons = ready.reduce((n, m) => n + m.lessons.length, 0);
  console.log(
    `\n${course.slug}: ${ready.length}/${course.modules.length} юнітів із контентом, ${lessons} уроків`,
  );

  for (const module of ready) {
    console.log(`  ${module.slug}`);
    for (const lesson of module.lessons) {
      console.log(
        `    ${lesson.slug.padEnd(24)} ${String(countWords(lesson.blocks)).padStart(4)} слів  ` +
          `${String(lesson.blocks.length).padStart(2)} блоків  ${lesson.durationMin} хв`,
      );
    }
  }

  const empty = course.modules.filter((m) => m.lessons.length === 0);
  if (empty.length > 0) console.log(`  ще без уроків: ${empty.length}`);
}

if (issues.length > 0) {
  console.error(`\nГейт публікації не пройдено — ${issues.length} проблем:\n`);
  for (const issue of issues) console.error(`  ✗ ${issue.where}\n    ${issue.problem}`);
  process.exit(1);
}

console.log("\n✓ Гейт публікації пройдено");
