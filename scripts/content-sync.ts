import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { loadCourses } from "../src/core/content/load";
import { publishableModules } from "../src/core/content/course";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  const { courses, issues } = loadCourses();

  if (issues.length > 0) {
    console.error(`Гейт публікації не пройдено — ${issues.length} проблем. Імпорт скасовано.`);
    for (const issue of issues) console.error(`  ✗ ${issue.where}: ${issue.problem}`);
    process.exit(1);
  }

  for (const { course } of courses) {
    const modules = publishableModules(course);

    const saved = await db.course.upsert({
      where: { slug: course.slug },
      create: {
        slug: course.slug,
        title: course.title,
        description: course.description,
        kind: course.kind,
        shelf: course.shelf,
        sortOrder: course.sortOrder,
        isPublished: modules.length > 0,
      },
      update: {
        title: course.title,
        description: course.description,
        kind: course.kind,
        shelf: course.shelf,
        sortOrder: course.sortOrder,
        isPublished: modules.length > 0,
      },
    });

    // sortOrder унікальний у межах курсу, тому спершу зсуваємо наявні значення
    // у від'ємний діапазон — інакше перестановка юнітів впирається в конфлікт.
    const existingModules = await db.module.findMany({
      where: { courseId: saved.id },
      select: { id: true },
    });
    for (const [i, m] of existingModules.entries()) {
      await db.module.update({ where: { id: m.id }, data: { sortOrder: -(i + 1) } });
    }

    const keptModuleSlugs: string[] = [];

    for (const [moduleIndex, module] of modules.entries()) {
      const savedModule = await db.module.upsert({
        where: { courseId_slug: { courseId: saved.id, slug: module.slug } },
        create: {
          courseId: saved.id,
          slug: module.slug,
          title: module.title,
          description: module.description,
          sortOrder: moduleIndex,
        },
        update: {
          title: module.title,
          description: module.description,
          sortOrder: moduleIndex,
        },
      });
      keptModuleSlugs.push(module.slug);

      const existingLessons = await db.lesson.findMany({
        where: { moduleId: savedModule.id },
        select: { id: true },
      });
      for (const [i, l] of existingLessons.entries()) {
        await db.lesson.update({ where: { id: l.id }, data: { sortOrder: -(i + 1) } });
      }

      const keptLessonSlugs: string[] = [];

      for (const [lessonIndex, lesson] of module.lessons.entries()) {
        await db.lesson.upsert({
          where: { slug: lesson.slug },
          create: {
            moduleId: savedModule.id,
            slug: lesson.slug,
            title: lesson.title,
            durationMin: lesson.durationMin,
            sortOrder: lessonIndex,
            blocks: lesson.blocks,
            isPublished: true,
          },
          update: {
            moduleId: savedModule.id,
            title: lesson.title,
            durationMin: lesson.durationMin,
            sortOrder: lessonIndex,
            blocks: lesson.blocks,
            isPublished: true,
          },
        });
        keptLessonSlugs.push(lesson.slug);
      }

      await db.lesson.deleteMany({
        where: { moduleId: savedModule.id, slug: { notIn: keptLessonSlugs } },
      });
    }

    await db.module.deleteMany({
      where: { courseId: saved.id, slug: { notIn: keptModuleSlugs } },
    });

    const lessonCount = modules.reduce((n, m) => n + m.lessons.length, 0);
    console.log(`✓ ${course.slug}: ${modules.length} юнітів, ${lessonCount} уроків`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
