#!/usr/bin/env node

import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const write = process.argv.includes("--write");
const ignoredDirectories = new Set([".git", ".build", "node_modules", "tmp"]);
const ignoredPrefixes = ["server/contracts/vista-server-endpoint-agent-handoff-v0.1"];
const binaryExtensions = new Set([".jpeg", ".jpg", ".pdf", ".png", ".pptx", ".xlsx"]);

async function filesUnder(directory = ".") {
  const entries = await readdir(path.join(root, directory), { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relative = path.join(directory, entry.name).replace(/^\.\//, "");
    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name) && !ignoredPrefixes.some(prefix => relative.startsWith(prefix))) {
        files.push(...await filesUnder(relative));
      }
    } else if (!binaryExtensions.has(path.extname(entry.name).toLowerCase())) {
      files.push(relative);
    }
  }
  return files;
}

let changedFiles = 0;
let replacements = 0;
for (const file of await filesUnder()) {
  if (file === "scripts/maintenance/update-document-root-references.mjs") continue;
  const original = await readFile(path.join(root, file), "utf8").catch(() => null);
  if (original === null) continue;
  const updated = original
    .split("\n")
    .map(line => /https?:\/\/\S*docs\//.test(line)
      ? line
      : line.replace(/(?<!01-)docs\//g, "01-docs/"))
    .join("\n");
  if (updated === original) continue;
  const count = (original.match(/(?<!01-)docs\//g) || []).length;
  changedFiles += 1;
  replacements += count;
  console.log(`${write ? "updated" : "would update"}: ${file} (${count})`);
  if (write) await writeFile(path.join(root, file), updated);
}

console.log(`${write ? "Updated" : "Would update"} ${replacements} references in ${changedFiles} files.`);
