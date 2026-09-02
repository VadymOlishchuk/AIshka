import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { glob } from "node:fs/promises";
import path from "node:path";

/**
 * Завантажує об'ємні значки Fluent Emoji (Microsoft, MIT) у public/emoji
 * і перезбирає список доступних файлів.
 *
 * Відповідність «символ -> файл у репозиторії» лежить у scripts/emoji-map.json:
 * назви тек там людські («Abacus»), а не кодпоінти, тому вивести їх з символу
 * автоматично не можна — юнікодні імена подекуди старіші за назви набору.
 * Якщо в контенті з'явився значок, якого немає в мапі, скрипт скаже про це.
 */
const BASE = "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/";
const OUT = "apps/main/public/emoji";

const codepointsOf = (symbol: string) =>
  [...symbol]
    .filter((c) => c !== "️" && c !== "‍")
    .map((c) => c.codePointAt(0)!.toString(16))
    .join("-");

function collectIcons(value: unknown, into: Set<string>) {
  if (Array.isArray(value)) return value.forEach((v) => collectIcons(v, into));
  if (value && typeof value === "object") {
    for (const [key, v] of Object.entries(value)) {
      if (key === "icon" && typeof v === "string" && v.trim()) into.add(v);
      else collectIcons(v, into);
    }
  }
}

async function main() {
  const map: Record<string, string> = JSON.parse(
    await readFile("scripts/emoji-map.json", "utf8"),
  );

  const used = new Set<string>();
  for await (const file of glob("content/**/*.json")) {
    collectIcons(JSON.parse(await readFile(file, "utf8")), used);
  }

  await mkdir(OUT, { recursive: true });

  let downloaded = 0;
  for (const [symbol, assetPath] of Object.entries(map)) {
    const target = path.join(OUT, `${codepointsOf(symbol)}.png`);
    if (existsSync(target)) continue;
    const res = await fetch(BASE + encodeURI(assetPath));
    if (!res.ok) {
      console.error(`✗ ${symbol}: ${res.status} ${assetPath}`);
      continue;
    }
    await writeFile(target, Buffer.from(await res.arrayBuffer()));
    downloaded++;
  }

  const files = (await readdir(OUT)).filter((f) => f.endsWith(".png")).sort();
  await writeFile(
    "libs/ui/src/emoji-assets.ts",
    "// Згенеровано `pnpm emoji:sync` — не редагувати руками.\n" +
      "// Значки, яких немає в наборі Fluent 3D, лишаються текстовими.\n" +
      "export const EMOJI_ASSETS = new Set([\n" +
      files.map((f) => `  "${f.slice(0, -4)}",\n`).join("") +
      "]);\n",
  );

  const missing = [...used].filter((s) => !map[s]);
  console.log(`✓ ${files.length} значків у ${OUT}, завантажено нових: ${downloaded}`);
  if (missing.length > 0) {
    console.log(`  без об'ємної версії (лишаються текстом): ${missing.join(" ")}`);
  }
}

main();
