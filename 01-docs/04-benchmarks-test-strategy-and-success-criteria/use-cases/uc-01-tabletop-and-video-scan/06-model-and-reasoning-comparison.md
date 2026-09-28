# Benchmark 0 — Model and Reasoning Comparison

Codex, 2026-09-07. Addendum to the [first-run review](05-agent-first-run-benchmark-review.md).
Status: review proposal; no configuration change or new model run authorized by this document.

## Finding

**This was not a controlled comparison of the same model and workflow.**
Pablo recalls using **GPT-5.6 Sol with Ultra** for the manual benchmark. The deployed AI Shop configuration uses **GPT-5.4 mini**, one provider request per run, and no explicitly requested reasoning effort.
The observed recognition discrepancies remain valid observations; their causes have not been isolated. The original review should have checked this difference before interpreting the quality gap.

## Configuration comparison

| Dimension | Manual benchmark | Deployed AI Shop |
| --- | --- | --- |
| Model | GPT-5.6 Sol, per Pablo's recollection | `gpt-5.4-mini` default; no deployed override |
| Reasoning | Ultra, per recollection | No explicit reasoning parameter; provider default not established here |
| Orchestration | Ultra supports automatic delegation; actual delegation unverified | One Responses API request per analysis attempt; no subagent orchestration |
| Output budget | Not recovered | `max_output_tokens: 1200` |
| Task and output | Count/classify physical objects and localize them | `areaScan` product rows, counts and uncertainty; no instance coordinates |
| Scope | Tabletop only, excluding reflections and lower shelf | Full-image facing-count instruction |

## Evidence and limits

- Read-only cloud check: `gcloud functions describe api --gen2 --region northamerica-northeast2 --project aishop-99d36 --format='json(state,serviceConfig.environmentVariables.OPENAI_MODEL,updateTime)'`.
- Result: `ACTIVE`, update time `2026-09-07T16:37:56.728480310Z`; `OPENAI_MODEL` absent from the selected environment fields.
- Source deployed in this session: `d596e35`. [Firebase composition](../../../../server/src/firebase.js) passes `process.env.OPENAI_MODEL`; the [adapter](../../../../server/src/openai-analyzer.js) defaults to `gpt-5.4-mini` when absent.
- The adapter sets the 1200-token output cap, image detail `auto`, and a 20-second provider timeout. These are configuration facts, not proof that any limit caused this example's errors.
- No raw provider response, resolved model snapshot, reasoning-token usage, original manual-chat metadata, or delegation trace was retrieved. Do not label Pablo's recalled setup as independently verified.
- [Official OpenAI model documentation](https://learn.chatgpt.com/docs/models), checked 2026-09-07, describes Ultra as using subagents for parallel work. Ultra is more than a model name; changing the API model alone does not reproduce that workflow.

## Proposed controlled comparison

1. Preserve the existing run and screenshot. Recover the manual chat's model, effort, prompt and available workflow evidence before claiming a matched setup.
2. Freeze the original image/hash, counting scope, identity granularity, prompt, output schema and reference revision. Human-review the reference before treating it as ground truth.
3. Compare models using the same single-call harness with documented supported reasoning settings and adequate recorded output/time budgets; verify API model availability before selecting an identifier.
4. Record requested and returned model identifiers, prompt/schema versions, image settings, token usage, latency, cost, failures and per-object discrepancies. Distinguish repeated trials from one fortunate answer.
5. Evaluate orchestration separately if testing Sol/Ultra-style behavior; a model-only comparison cannot establish the contribution of delegation or multiple inspection passes.

## Implication for Claude

The first-run review is a useful discrepancy report, not evidence that the same model performed worse through the API. Model capability, reasoning, orchestration, prompt, image handling and output constraints are possible contributors.
Do not assume a model upgrade fixes counting, identity grouping or localization. Propose any model/configuration experiment through the project's scope and approval rules; this addendum changes documentation only.
