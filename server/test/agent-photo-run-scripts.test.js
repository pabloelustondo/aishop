import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createServer } from "node:http";
import { promisify } from "node:util";
import test from "node:test";

const execute = promisify(execFile);
const root = new URL("../../", import.meta.url);
const token = "fixture.token.private";

test("individual curl exercises send the expected requests and display no credential", async t => {
  const calls = [];
  let httpStatus = 200;
  const report = { summary: "fixture only", identifiedProducts: [], uncertainItems: [] };
  const server = createServer(async (request, response) => {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    calls.push({ method: request.method, url: request.url,
      auth: request.headers.authorization, contentType: request.headers["content-type"],
      body: Buffer.concat(chunks).toString() });
    response.writeHead(httpStatus, { "Content-Type": "application/json" });
    response.end(JSON.stringify(httpStatus === 200 ? { analysis: {
      analysisId: "photo-fixture", status: request.method === "POST" ? "analyzing" : "analyzed",
      report, runCount: 1, failureReason: null
    } } : { error: { code: "analysis_state_invalid", retryable: false } }));
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const env = { PATH: process.env.PATH, BASE: `http://127.0.0.1:${server.address().port}`,
    TOKEN: token, ANALYSIS_ID: "photo-fixture", CONTEXT: 'Count "blue" bottles.\nOnly the lower shelf.' };
  const run = async (script, overrides = {}) => {
    const { stdout, stderr } = await execute("bash", [
      `scripts/agent-photo-run-tests/${script}.sh`
    ], { cwd: root, env: { ...env, ...overrides } });
    assert.ok(!stdout.includes(token) && !stderr.includes(token));
    return JSON.parse(stdout);
  };

  for (const script of ["run-photo", "refine-photo", "read-status", "read-report"]) {
    await t.test(script, async () => {
      const result = await run(script);
      const call = calls.at(-1);
      const post = script.endsWith("photo");
      assert.equal(result.httpStatus, 200);
      assert.equal(call.method, post ? "POST" : "GET");
      assert.equal(call.url, `/v1/agent/analyses/photo-fixture${post ? "/run" : ""}`);
      assert.equal(call.auth, `Bearer ${token}`);
      if (script === "refine-photo") {
        assert.deepEqual(JSON.parse(call.body), { context: env.CONTEXT });
        assert.equal(call.contentType, "application/json");
      } else assert.equal(call.body, "");
      if (script === "read-report") assert.deepEqual(result.report, report);
    });
  }
  await t.test("HTTP errors remain visible; a shell exit of zero is not an API pass", async () => {
    httpStatus = 409;
    const result = await run("run-photo");
    assert.equal(result.httpStatus, 409);
    assert.equal(result.error.code, "analysis_state_invalid");
  });
  await t.test("unsafe or missing inputs stop before any request", async () => {
    const before = calls.length;
    for (const overrides of [{ BASE: "" }, { TOKEN: "" }, { TOKEN: 'bad"\nheader' },
      { ANALYSIS_ID: "../other" }, { BASE: "http://user:password@host" }, { CONTEXT: "" }]) {
      await assert.rejects(run("refine-photo", overrides));
    }
    assert.equal(calls.length, before);
  });
});
