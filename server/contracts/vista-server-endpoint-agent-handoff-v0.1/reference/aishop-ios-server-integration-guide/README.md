# AI Shop iOS–Server Integration Guide

> **Portable-bundle note:** this is a contextual snapshot from the originating
> AI-Shop repository. The four implementation links below intentionally do not
> resolve inside this VISTA handoff ZIP. Inspect and verify the actual server
> repository before relying on any named path, configuration, or behavior.

HumanReviewerInitials:PME

## Purpose

This reference explains the implemented AI Shop path from authenticated iPhone capture to a persisted, AI-generated inspection report. It is intended as a build specification for another iOS application using the same server pattern.

## Document map

1. [Architecture and sequence](01-architecture-and-sequence.md)
2. [Firebase customer authentication](02-firebase-authentication.md)
3. [Image capture and preparation](03-image-capture-and-preparation.md)
4. [HTTP API contracts](04-http-api-contracts.md)
5. [Server processing and persistence](05-server-processing-and-persistence.md)
6. [iOS implementation recipe](06-ios-implementation-recipe.md)
7. [Server reuse and configuration](07-server-reuse-and-configuration.md)
8. [Errors, security, and limits](08-errors-security-and-limits.md)
9. [Validation and migration checklist](09-validation-and-migration-checklist.md)

## Authoritative implementation

- iOS client: [`ios/AIShop/AIShop`](../../../ios/AIShop/AIShop)
- Server: [`server/src`](../../../server/src)
- Server tests: [`server/test`](../../../server/test)
- iOS tests: [`ios/AIShop/AIShopTests`](../../../ios/AIShop/AIShopTests)

## Integration boundary

The mobile application owns identity, camera capture, user experience, and request construction. The server owns authentication verification, strict input validation, immutable evidence storage, AI-provider access, report validation, ownership enforcement, and audit records.

Do not copy Firebase identifiers, bundle identifiers, URLs, or deployment secrets blindly. Register the second application explicitly and inject environment-specific configuration.
