# Sprint 010 — Output-Limit Failure Acceptance

Date: 2026-09-08. Status: PROPOSED; required by [the sprint plan](01-sprint-plan.md).

## Incident motivating the requirement

The pharmacy benchmark's initial automatic run failed with `provider_failed`.
Its request returned 502 after about 7.09 seconds; the configured output cap was 1,200 tokens.
Output-limit incompleteness is a hypothesis, not a proven diagnosis of that historical failure.
New instrumentation cannot recover metadata already discarded by the old implementation.

## Required diagnostic evidence

- Correlate the event and durable run summary with request, analysis, run and provider request IDs.
- Record requested/returned model, configured output-token limit and provider duration.
- Distinguish provider HTTP status from the response payload's completion status.
- Preserve allowlisted incomplete reason, including output-token exhaustion when explicitly reported.
- Capture available token usage before parsing or validating the generated report.
- Classify explicit output-limit incompleteness as `provider_output_limit`, ahead of downstream JSON errors.
- Do not infer that classification merely because token usage approaches the configured cap.
- If incomplete metadata is absent, record the observed parse/schema failure and leave the cause unknown.
- Apply the same field allowlists to persisted diagnostics and logs; retain no raw response text.
- Keep diagnostics available even when report parsing fails; missing usage/request IDs remain null.
- Keep the broad public error contract compatible; expose only a safe diagnostic reference and accurate wording.
- Replace “The model could not be reached” for generic provider failure with wording that does not claim a network cause.
- Identify the trigger as initial automatic run, refinement or retry; `/run` alone cannot distinguish these.

## Required verification

1. Fixture provider returns HTTP 200 with incomplete status, output-limit reason and partial JSON.
2. Assert `provider_output_limit`, configured cap, status, reason and available usage survive into logs and the run summary.
3. Assert the same request/run reference connects the API failure, provider event and saved run.
4. Separate fixtures cover HTTP 429/5xx, timeout, malformed JSON and schema-invalid complete output.
5. Verify none is misclassified as output-limit exhaustion, including high usage without explicit incomplete metadata.
6. Inject private markers in response text and verify they reach neither logs nor saved diagnostic fields.
7. Verify the page does not claim the provider was unreachable when a response was received but unusable.
8. Include fixture coverage in the offline E2E gate; record actual results in the delivered-scope report.

## Acceptance boundary

After an authorized TEST deployment, verify searchable structured fields and request correlation live.
Fixture proof and deployed logging proof are separate evidence; neither proves the historical incident's cause.
No paid reproduction, output-cap change or automatic retry is authorized by this diagnostic requirement.
