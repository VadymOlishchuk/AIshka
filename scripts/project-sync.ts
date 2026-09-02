/**
 * Імпорт проєктів-збірок. Той самий принцип, що й для курсів: контент живе
 * в git, гейт вирішує, чи пускати його в базу, порядок задається файлом.
 */
import "dotenv/config";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { ProjectInput, checkProject } from "../src/core/content/project";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const DIR = path.join(process.cwd(), "content", "projects");

async function main() {
  const files = (await readdir(DIR)).filter((f) => f.endsWith(".json"));
  const problems: string[] = [];
  const parsed = [];

  for (const file of files) {
    const raw = JSON.parse(await readFile(path.join(DIR, file), "utf8"));
    const result = ProjectInput.safeParse(raw);
    if (!result.success) {
      for (const issue of result.error.issues) {
        problems.push(`${file} → ${issue.path.join(".")}: ${issue.message}`);
      }
      continue;
    }
    for (const issue of checkProject(result.data)) {
      problems.push(`${issue.where}: ${issue.problem}`);
    }
    parsed.push(result.data);
  }

  if (problems.length > 0) {
    console.error("\n✗ Гейт проєктів не пройдено:\n");
    for (const p of problems) console.error(`  ${p}`);
    process.exit(1);
  }

  for (const project of parsed) {
    const row = await db.project.upsert({
      where: { slug: project.slug },
      create: {
        slug: project.slug,
        title: project.title,
        description: project.description,
        outcome: project.outcome,
        estimate: project.estimate,
        coverUrl: project.coverUrl,
        sortOrder: project.sortOrder,
        isPublished: true,
      },
      update: {
        title: project.title,
        description: project.description,
        outcome: project.outcome,
        estimate: project.estimate,
        coverUrl: project.coverUrl,
        sortOrder: project.sortOrder,
        isPublished: true,
      },
    });

    let slots = 0;
    let missing = 0;

    for (const [si, stage] of project.stages.entries()) {
      const stageRow = await db.stage.upsert({
        where: { projectId_slug: { projectId: row.id, slug: stage.slug } },
        create: {
          projectId: row.id,
          slug: stage.slug,
          title: stage.title,
          intent: stage.intent,
          icon: stage.icon,
          sortOrder: si,
        },
        update: { title: stage.title, intent: stage.intent, icon: stage.icon, sortOrder: si },
      });

      for (const [li, slot] of stage.slots.entries()) {
        // Урок шукаємо за слагом. Якщо його немає — слот лишається без виходу,
        // тому це помилка, а не попередження.
        const lesson = await db.lesson.findFirst({
          where: { slug: slot.lessonSlug },
          select: { id: true },
        });
        if (!lesson) {
          console.error(`  ✗ ${stage.slug}/${slot.slug}: уроку «${slot.lessonSlug}» немає`);
          missing++;
          continue;
        }

        await db.slot.upsert({
          where: { stageId_slug: { stageId: stageRow.id, slug: slot.slug } },
          create: {
            stageId: stageRow.id,
            slug: slot.slug,
            title: slot.title,
            kind: slot.kind,
            format: slot.format,
            minutes: slot.minutes,
            brief: slot.brief,
            lessonId: lesson.id,
            sortOrder: li,
          },
          update: {
            title: slot.title,
            kind: slot.kind,
            format: slot.format,
            minutes: slot.minutes,
            brief: slot.brief,
            lessonId: lesson.id,
            sortOrder: li,
          },
        });
        slots++;
      }
    }

    if (missing > 0) process.exitCode = 1;
    console.log(`✓ ${project.slug}: ${project.stages.length} стадій, ${slots} слотів`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
