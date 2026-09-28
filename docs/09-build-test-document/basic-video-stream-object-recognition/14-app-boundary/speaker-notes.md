# Debug harness and application startup

## Speaker notes

ApplicationBootstrap decides whether the Debug diagnostic path applies.

The normalSession closure contains both Firebase configuration and AuthSession construction.

The diagnostic path returns nil before either normal service initializes.

The normal route retains the existing authentication flow.

VisionHarnessModel verifies resource hashes, starts timestamp-paced replay, and receives progress on the main actor.

The view shows possible match, raw-score metrics, a final report, and retained whole-frame images.

It exports the JSONL log through the local share sheet.

The copy script bundles only banana.JPG and the two trimmed videos for Debug.

The Release compilation removes diagnostic route strings and harness code.

A separate bundle audit checks that Release contains no fixture media or annotations.

All 25 app tests passed in Simulator on 2026-09-20.

Debug, Release, and signed Debug builds succeeded.

We did not install or run this build on a physical iPhone.

The excerpt reformats the bootstrap guard.

## Code and evidence

- [Bootstrap](../../../../ios/AIShop/AIShop/App/ApplicationBootstrap.swift)
- [App entry](../../../../ios/AIShop/AIShop/App/AIShopApp.swift)
- [Harness model](../../../../ios/AIShop/AIShop/Diagnostics/VisionHarnessModel.swift)
- [Startup tests](../../../../ios/AIShop/AIShopTests/ApplicationBootstrapTests.swift)
- [Harness tests](../../../../ios/AIShop/AIShopTests/VisionHarnessModelTests.swift)
- [Bundle audit](../../../../e2e/ios/verify-app-bundle.rb)
