# 005 - AI Shop Through the 12-Step SDLC2 Lifecycle

AI Shop has two connected purposes.
It is a real application for analysing shelf images and producing item reports.
It is also a case study showing how SDLC2 evaluates and develops an AI architecture.

This slide introduces the twelve steps lightly.
The remainder of the presentation uses concrete AI Shop evidence to examine them.
The steps form a lifecycle, but learning can send the team back to an earlier decision.

## Understand
Business and Technical Context establishes the retail problem and technical environment.
Intent states the outcome the application should create for its users.
Use Cases and System Model identify the people, system boundaries, and important interactions.

## Evaluate
Benchmarks and Test Strategy define how usefulness, accuracy, and reliability will be judged.
High-Level Architecture assigns responsibilities across the browser, server, storage, and AI.
The Working Proof of Concept tests whether that architecture can produce useful evidence.

## Build
Planning turns the validated direction into small, reviewable increments.
Low-Level Design and Specifications define interfaces, records, states, and component behaviour.
Build, Code, and Test implements those decisions and checks each increment.

## Operate and Learn
Deployment, Infrastructure, and Operational Reality expose the system to real constraints.
Review, Human QA, and Release confirm that the result is useful and ready for its audience.
Observability and Learning turn runtime evidence, defects, and feedback into better decisions.

## Transition to the technical story
The next slides move from the framework into the actual Items Vision implementation.
They follow a shelf photo from the browser to the server, storage, AI analysis, and report.
Later sections return to benchmarks, tests, deployment evidence, human review, and learning.
The purpose is not to claim that a diagram proves the architecture.
The purpose is to show how decisions and evidence accumulate across the lifecycle.

## Visual direction
Show one continuous horizontal lifecycle divided into four clearly labelled phases.
Place three numbered steps in each phase and retain the full step names.
Use a return path from step 12 toward the beginning to represent continued learning.
Keep the composition readable as an overview rather than a detailed process diagram.
