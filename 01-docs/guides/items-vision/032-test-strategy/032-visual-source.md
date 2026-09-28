# 032 - Visual Source

## Core message
Model-quality evaluation and system-reliability testing answer different questions.
A release decision needs evidence from both.

## Composition
Use a 1600 by 900 canvas with the established light background and navy text.
Place the title at the upper left below the short teal rule.
Draw two parallel horizontal test rails that merge only at the final decision gate.

## Upper rail: Vision quality
Use teal for the rail and labels.
Show these checkpoints:
1. Freeze image, contract, prompt, schema, and reference.
2. Change one model, reasoning, context, or image setting.
3. Score identity, omissions, counts, inventions, and uncertainty.
4. Record latency, usage, cost, retries, and review effort.

## Lower rail: System reliability
Use purple for the rail and labels.
Show these checkpoints:
1. Access control and evidence upload.
2. Durable progress, refresh, terminal state, and saved result.
3. Refinement, retry, and safe diagnostics.
4. Video provenance, duplicate prevention, and resumable transfer.

## Final gate
Merge both rails into one labelled outcome:
`Evidence for human release review`.
Add a quiet note that automated success does not establish visual accuracy.

## Output
Generate `032-visual.svg` as an editable 16:9 SVG.
Keep every label as SVG text.
