# 02 - Main Use Cases and System Model

AI Shop and VISTA are related iPhone-led product experiences.
They serve different people and decisions while sharing much of the server foundation.
This slide introduces those use cases before the presentation explains implementation details.

## Use case 1: AI Shop shopping experience
A shopper uses the AI Shop iPhone app while considering a product or shelf.
The phone captures visual evidence and can perform part of the image processing locally.
Server-side AI adds capabilities that are better protected, coordinated, or processed remotely.
The result helps the shopper make a better-informed purchasing decision.

This is the earlier AI Shop product path.
Its iPhone client and individual server endpoints remain relevant to the complete product intent.
Later slides should state which functions are implemented and which remain immature.

## Use case 2: VISTA shelf inspection
A retail team uses VISTA to inspect products and presentation across store shelves.
The goal is to identify visible products, count facings, and retain evidence for review.
Today, a person can upload a shelf photograph or video manually through `agent.html`.
The web Agent provides the more robust current analysis and review workflow.

The intended destination is integration with the separate VISTA iPhone application.
That application would capture shelf evidence during an inspection and use the same server capabilities.
The presentation must label this integration as intended until end-to-end evidence confirms it.

## Shared system model
Both use cases need secure access, image intake, AI coordination, and result handling.
The server protects provider credentials and centralises reusable analysis behaviour.
Shared capabilities reduce duplicated implementation across AI Shop and VISTA.
The products can still use different prompts, records, interfaces, and decision outputs.

Common infrastructure does not make the two products identical.
AI Shop supports shopper decisions.
VISTA supports shelf and store inspection work.

## Transition
The next slides can follow each user path in more detail.
The Low-Level Design and Architecture section will focus on the web Vision Agent.
It will also show how the earlier endpoints and iPhone clients relate to the common server.

## Visual direction
Place the shared vision service as one horizontal foundation.
Above it, show the AI Shop iPhone shopper path and the VISTA inspection path.
Within VISTA, distinguish the current manual web Agent from the intended iPhone integration.
