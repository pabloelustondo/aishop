# Diagnostic app boundary

## Speaker notes

The app boundary makes the package demonstrable without turning a diagnostic experiment into the normal product experience. Bootstrap selects the diagnostic route before creating Firebase or the authentication session.

The harness model is on the main actor. It prevents overlapping starts, uses a generation token for updates, pauses playback on completion or failure, and writes a report beside the log. The screen exposes local log export.

Debug builds copy only the approved reference and trimmed videos. Release excludes the diagnostic route and fixture assets. The evaluator and its annotation file stay outside the app.

The saved Simulator tests include a check that the diagnostic host has no Firebase instance. That test depends on running the diagnostic scheme.

## Fine print

- [Bootstrap](../../../../../../ios/AIShop/AIShop/App/ApplicationBootstrap.swift)
- [Harness model](../../../../../../ios/AIShop/AIShop/Diagnostics/VisionHarnessModel.swift)
- [Bundle checks](../../../../../../e2e/ios/verify-app-bundle.rb)
