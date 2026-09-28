# The session-log contract

## Speaker notes

The session log is newline-delimited JSON. Each event has a sequence number, session identity, kind, optional frame identity and media time, plus typed fields.

The header identifies the schema, host, build, input hashes, and scoring profile. This context matters when two runs appear to disagree. The body records the decisions that led to the result.

The reader requires consecutive sequence numbers, one session, one header, one stream-end event, and one final summary. Every sampled frame must have exactly one score. Truncated lines, missing scores, or error events reject a session as successful evidence.

These checks detect inconsistency. They are not a cryptographic signature proving who produced a log. Keep that trust boundary explicit.

## Fine print

- [Log schema](../../../../../../ios/AIShop/AIShopVision/Sources/AIShopVision/SessionLog/LogValue.swift)
- [Log validation](../../../../../../ios/AIShop/AIShopVision/Sources/AIShopVision/SessionLog/SessionLog.swift)
- [Log tests](../../../../../../ios/AIShop/AIShopVision/Tests/AIShopVisionTests/SessionLogTests.swift)
