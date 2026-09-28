// Local static gate. Reads the approved baseline; never writes or publishes Git state.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
process.chdir(root);
const baseline = "14be18b";
const read = file => readFileSync(file, "utf8");
const baselinePath = file => file.startsWith("01-docs/") ? file.slice(3) : file;
const before = file => execFileSync("git", ["show", `${baseline}:${baselinePath(file)}`], { encoding: "utf8" });
const walk = dir => readdirSync(dir).flatMap(name => {
  const file = path.join(dir, name);
  return statSync(file).isDirectory() ? walk(file) : [file];
});

// Moved code must remain the same apart from paths and explanatory JSDoc.
for (const name of ["runner", "collector"]) {
  const oldPath = `server/src/agent-analysis-${name}.js`;
  const newPath = `server/src/agent/analysis/agent-analysis-${name}.js`;
  const normalize = text => text.replaceAll('from "../../', 'from "./')
    .replace(/\/\*\*[\s\S]*?\*\//g, "");
  assert.equal(normalize(read(newPath)), normalize(before(oldPath)), `${name} behavior changed`);
  const oldExports = await import(new URL(oldPath, `file://${root}`));
  const newExports = await import(new URL(newPath, `file://${root}`));
  assert.deepEqual(Object.keys(oldExports), Object.keys(newExports));
  for (const key of Object.keys(oldExports)) assert.equal(oldExports[key], newExports[key]);
}

const editedSource = execFileSync("git", ["diff", "--name-only", baseline, "--", "server/src"],
  { encoding: "utf8" }).trim().split("\n").filter(Boolean);
const allowed = new Set(["server/src/README.md", "server/src/agent-analysis-runner.js",
  "server/src/agent-analysis-collector.js", "server/src/agent-api-handler.js", "server/src/openai-analyzer.js"]);
for (const file of editedSource) assert.ok(allowed.has(file), `out-of-scope source: ${file}`);
for (const file of ["firebase.json", "firestore.indexes.json", "server/src/analysis-contracts.js",
  "server/src/agent-evidence-store.js", "server/src/agent-analysis-store.js", "server/src/firebase.js",
  "server/src/agent-task-enqueuer.js", "server/src/agent-background-functions.js"]) {
  assert.equal(read(file), before(file), `${file} must remain unchanged`);
}
const syncPart = text => text.split("const RESPONSE_ID =")[0]
  .replace(/^import .* from "\.\/recognition\/background\/.*";\n/gm, "");
assert.equal(syncPart(read("server/src/openai-analyzer.js")),
  syncPart(before("server/src/openai-analyzer.js")), "synchronous adapter changed");

const guideFiles = walk("01-docs/guides/vision-agent-photo-analysis").filter(file => file.endsWith(".md"));
const moduleFiles = [...walk("server/src/agent"), ...walk("server/src/recognition")];
const documents = [...guideFiles, ...moduleFiles.filter(file => file.endsWith(".md")),
  ...walk("01-docs/10-review-and-release/sprint-015-agent-photo-run").filter(file => file.endsWith(".md")),
  "scripts/agent-photo-run-tests/README.md", "server/src/README.md"];
let links = 0;
for (const file of documents) {
  for (const [, label, raw] of read(file).matchAll(/\[([^\]]+)\]\(([^)\n]+)\)/g)) {
    if (/^(https?:|#)/.test(raw)) continue;
    const target = raw.replace(/^<|>$/g, "").split("#")[0];
    const [, destination, line] = target.match(/^(.*?)(?::(\d+))?$/);
    const resolved = path.resolve(path.dirname(file), destination);
    assert.ok(existsSync(resolved), `${file}: missing link ${target}`);
    if (line) {
      const text = read(resolved).split("\n")[Number(line) - 1];
      assert.notEqual(text, undefined, `${file}: line outside ${target}`);
      const symbols = [...label.split(" — ")[0].matchAll(/([\w.]+)\(\)/g)]
        .map(match => match[1].split(".").at(-1));
      if (symbols.length) assert.ok(symbols.some(symbol => text.includes(symbol)),
        `${file}: ${symbols.join("/")} not at ${target}`);
    }
    links++;
  }
}
for (const file of walk("01-docs/07-planning/sprints/sprint-015-agent-photo-run-refactor")) {
  const lines = read(file).trimEnd().split("\n").length;
  assert.ok(lines <= 50, `${file}: ${lines} decision lines`);
  assert.equal(read(file), before(file), "approved decisions must remain untouched");
}
for (const file of walk("scripts/agent-photo-run-tests").filter(file => file.endsWith(".sh"))) {
  execFileSync("bash", ["-n", file]);
}
for (const file of moduleFiles.filter(file => file.endsWith(".js"))) {
  execFileSync("node", ["--check", file]);
}
execFileSync("git", ["diff", "--check"]);
console.log(`PASS: ${links} documentation links; export identity, scoped moves, protected sources, scripts and decision limits.`);
