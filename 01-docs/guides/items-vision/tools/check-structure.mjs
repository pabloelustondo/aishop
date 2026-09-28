#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
let directoryCount = 0;
let markdownCount = 0;

async function checkDirectory(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  if (path.basename(directory) === ".build") return;
  directoryCount += 1;
  assert.ok(entries.some(entry => entry.isFile() && entry.name === "README.md"),
    `${path.relative(root, directory) || "."} is missing README.md`);
  for (const entry of entries) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) await checkDirectory(file);
    if (!entry.isFile() || path.extname(entry.name) !== ".md") continue;
    const lines = (await readFile(file, "utf8")).split("\n").length - 1;
    markdownCount += 1;
    assert.ok(lines <= 50, `${path.relative(root, file)} has ${lines} lines`);
  }
}

await checkDirectory(root);
console.log(`PASS: ${directoryCount} folders have READMEs; ${markdownCount} Markdown files are at most 50 lines.`);
