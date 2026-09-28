# How to test

## Speaker notes

Start with the Mac integration gate. It runs the package tests with real Vision and verifies that every required test actually executed. This covers the production analysis pipeline with recorded video as its input edge.

The Simulator tests answer a different question: whether diagnostic startup bypasses normal services and whether the harness model handles its states. The saved app-test snapshot has twenty-five passing tests. It does not establish working Vision inference on the Simulator.

The final layer is a physical iPhone run observed by Pablo, followed by comparison of exported logs. These layers complement each other. Neither a package pass nor an app build can stand in for device acceptance.

## Fine print

- [Mac gate](../../../../../../e2e/ios/run.zsh)
- [Integration tests](../../../../../../ios/AIShop/AIShopVision/Tests/AIShopVisionTests/PipelineIntegrationSuite.swift)
- [App tests](../../../../../../ios/AIShop/AIShopTests)
- [Fresh gate evidence](../artifacts/evidence/mac-gate-r04.log)
