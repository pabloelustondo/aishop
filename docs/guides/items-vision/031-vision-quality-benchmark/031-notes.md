# 031 - One Shelf, Three Different Readings

This slide uses the actual dense pharmacy shelf and recorded analysis artifacts.
The concrete disagreement explains why benchmark design matters.

## The original evidence
All three readings use the same 1152 by 1536 shelf photograph.
It contains small labels, occlusion, stacked products, edge cropping, and a carton.
Those conditions make both identification and counting difficult.

## Reading 1: provisional reference
The numbered overlay maps 42 product groups across four shelf regions.
Its associated GPT report counts 94 visible physical units.
This reference was obtained by hand from GPT and is not human-approved ground truth.

## Reading 2: Agent first run
The deployed Agent returned 23 product rows totalling 62 facings.
It also recorded three uncertain entries.
The run completed and produced a reviewable report, but benchmark parity was not demonstrated.
Some products were missed, grouped differently, or given an incorrect brand name.

## Reading 3: independent visual review
A separate shelf-by-shelf reading estimated about 57 front facings.
It also identified 21 units stacked behind those fronts.
That reading remained a model-assisted opinion rather than verified ground truth.

## Why the totals disagree
The provisional reference counts visible physical units.
The Agent contract asks for front facings.
The independent reading reports both measures separately.
Product grouping and identity depth also differ across the readings.

Dividing 62 by 94 would produce a misleading number, not an accuracy score.
The comparison must first fix the counting rule and required identification level.
A human reviewer must then validate the reference against the source photograph.

## Visual direction
Show the actual photograph, numbered overlay, and Agent screenshot prominently.
Use the real totals as evidence, with a warning that they answer different questions.
Keep the conclusion simple: define and verify the reference before scoring the model.
