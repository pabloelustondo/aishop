import assert from "node:assert/strict";
import { mkdtempSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { APPROVED_VISTA_PACKAGE_LIMITS } from "../src/vista-package-limits.js";
import { createVistaDecoderWorkloads } from
  "../test-support/vista-decoder-workloads.js";

test("legal maximum JPEG workloads fit the deployed process envelope",
  { timeout: 120_000 }, async (context) => {
    const directory = mkdtempSync(join(tmpdir(), "vista-decoder-memory-"));
    context.after(() => rmSync(directory, { recursive: true }));
    const workloads = await createVistaDecoderWorkloads(directory);
    const environment = { ...process.env };
    for (const { environment: name, value } of
      Object.values(APPROVED_VISTA_PACKAGE_LIMITS)) environment[name] = String(value);
    environment.FIREBASE_CONFIG = JSON.stringify({ projectId: "demo-vista",
      storageBucket: "demo-vista.appspot.com" });
    const denseBytes = statSync(workloads.dense).size;
    assert.ok(denseBytes > 3_000_000 && denseBytes <= 5_242_880);
    const denseCount = Math.floor((104_857_600 - 327_680) / denseBytes);
    assert.ok(denseCount >= 20 && denseCount <= 39);
    for (const [path, count] of [[workloads.compact, 39],
      [workloads.dense, denseCount]]) {
      const probe = spawnSync(process.execPath,
        ["test-support/vista-decoder-memory-process.js", path, String(count)],
        { cwd: new URL("../", import.meta.url), encoding: "utf8",
          env: environment, timeout: 110_000 });
      assert.equal(probe.status, 0, probe.stderr);
      const value = JSON.parse(probe.stdout.trim());
      assert.equal(value.retainedBytes, 104_857_600);
      assert.equal(value.handlerReady, true);
      assert.ok(value.maximumRss < 700 * 1024 * 1024);
      assert.ok(value.elapsedMs < 30_000, `decode stage took ${value.elapsedMs}ms`);
      context.diagnostic(JSON.stringify(value));
    }
  });
