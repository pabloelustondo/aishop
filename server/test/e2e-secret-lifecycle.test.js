import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, copyFileSync, existsSync, symlinkSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

// Every test runs the actual launcher in an isolated tree with fake credentials
// and a fake Firebase executable. No emulator or external service is started.
const hasZsh = spawnSync("zsh", ["--version"]).status === 0;
for (const scenario of ["success", "child failure", "backup failure", "interrupt", "absent", "symlink", "locked"]) {
  test(`emulator secret lifecycle: ${scenario}`, { skip: !hasZsh }, () => {
    const root = mkdtempSync(join(tmpdir(), "aishop-secret-test-"));
    try {
      for (const dir of ["server", "e2e/server", "bin"]) mkdirSync(join(root, dir), { recursive: true });
      const script = join(root, "e2e/server/run.zsh");
      copyFileSync(new URL("../../e2e/server/run.zsh", import.meta.url), script);
      const secret = join(root, "server/.secret.local");
      const original = "FAKE_TEST_VALUE=preserve-me\n";
      const target = join(root, "original");
      if (scenario === "symlink") { writeFileSync(target, original); symlinkSync(target, secret); }
      else if (scenario !== "absent") writeFileSync(secret, original, { mode: 0o600 });
      if (scenario === "locked") mkdirSync(join(root, "server/.secret.local.e2e-lock"));
      const fakeFirebase = scenario === "interrupt" ? 'kill -TERM "$PPID"\nsleep 0.1\nexit 0'
        : scenario === "child failure" ? "exit 7" : "exit 0";
      writeFileSync(join(root, "bin/firebase"), "#!/bin/zsh\n" + fakeFirebase + "\n", { mode: 0o700 });
      if (scenario === "backup failure") writeFileSync(join(root, "bin/cp"), "#!/bin/zsh\nexit 1\n", { mode: 0o700 });
      const result = spawnSync("zsh", [script], {
        env: { ...process.env, PATH: join(root, "bin") + ":" + process.env.PATH },
        encoding: "utf8", timeout: 5000
      });
      assert.equal(result.error, undefined);
      if (["success", "absent"].includes(scenario)) assert.equal(result.status, 0, result.stderr);
      else if (scenario === "child failure") assert.equal(result.status, 7);
      else if (scenario === "interrupt") assert.equal(result.status, 143);
      else assert.notEqual(result.status, 0);
      if (scenario === "absent") assert.equal(existsSync(secret), false);
      else assert.equal(readFileSync(secret, "utf8"), original);
      if (scenario === "symlink") assert.equal(readFileSync(target, "utf8"), original);
      if (scenario !== "locked") assert.equal(existsSync(join(root, "server/.secret.local.e2e-lock")), false);
    } finally { rmSync(root, { recursive: true, force: true }); }
  });
}
