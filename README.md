# AI Shop

HumanReviewerInitials:PME

AI Shop is a public experimental project exploring how an iPhone camera and AI can help people understand products and shop more wisely.

## Intent

Nearby supermarkets often differ in price, quality, and selection. AI Shop acts as a second pair of eyes: it examines what the camera sees, combines that evidence with relevant shopping context, and presents a direct, understandable report. The person always makes the final buying decision.

Read the [project intent](docs/02-intent/intent.md) and its evolution toward [auditable retail shelf inspection](docs/02-intent/intent-03-auditable-retail-shelf-inspection.md).

## Primary use cases

- [Target Product](docs/03-system-model-and-use-cases/use-case-02-target-product-scan.md): aim at one specific product and receive a focused report about it.
- [Area Scan](docs/03-system-model-and-use-cases/use-case-03-area-scan.md): photograph a shelf or display and identify multiple visible products.
- [Shelf Inspection Review](docs/03-system-model-and-use-cases/use-case-04-submit-and-review-shelf-inspection.md): retain original evidence and allow a human to verify AI findings.

## How it works

The native iPhone app captures an image and sends it to the AI Shop server. The server protects the OpenAI API credential, requests visual analysis, and returns a structured report to the app. See the [high-level architecture](docs/06-solution-design-and-architecture/high-level-architecture.md) and [audit architecture](docs/06-solution-design-and-architecture/architecture-02-audit-storage-and-human-review.md).

## Current state

The proof of concept runs on an iPhone and supports Target Product and Area Scan reports. The next evolution adds durable full-image storage and human review for auditable shelf inspections.

## Repository

- `ios/` — native iPhone application.
- `server/` — Firebase-hosted API and OpenAI integration.
- [`docs/`](docs/README.md) — intent, use cases, benchmarks, architecture, sprint plans, evidence, and operational learning.

## Project collaborators

- `PME` — Pablo Elustondo — [pablo@elustondo.ai](mailto:pablo@elustondo.ai)

## Development method

AI Shop follows a small-document SDLC2 process with explicit human review before coding or commits. Contributors should read [AGENTS.md](AGENTS.md) and [SDLC2-Governance](docs/00-sdlc2-governance/README.md) before making changes.
