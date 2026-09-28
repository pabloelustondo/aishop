# AI Shop iOS Client

This folder contains the native SwiftUI application for iPhone. The app
authenticates with Firebase, captures a shelf photograph, submits it to the
server, and presents either a target-product or area-scan report.

The iOS client uses `POST /inspections`. It does not use the browser Vision
Agent routes under `/v1/agent/analyses`.

## Project layout

- `AIShop/AIShop.xcodeproj` — Xcode project with app and test targets.
- `AIShop/AIShop/App/` — application entry point and configuration.
- `AIShop/AIShop/Auth/` — Firebase session and Google sign-in UI.
- `AIShop/AIShop/Camera/` — camera authorization, preview, and capture.
- `AIShop/AIShop/Analysis/` — API contract, client, state, and reports.
- `AIShop/AIShop/UI/` — scan selection, camera, status, and report screens.
- `AIShop/AIShop/Support/` — plist and build-configuration files.
- `AIShop/AIShopTests/` — request, decoding, navigation, and race tests.

## Runtime flow

`AIShopApp` configures Firebase and shows authentication when required.
`AIShopRootView` selects a scan mode and opens `CameraScreen`. Captured JPEG
bytes pass through `AnalysisViewModel` to `InspectionAPIClient`, which adds
the current Firebase ID token and posts the inspection. The returned report
drives the mode-specific SwiftUI result screen.

## Configuration

The server base URL comes from `AI_SHOP_SERVER_BASE_URL` through the app's
Info.plist configuration. Shared settings live in `Shared.xcconfig`; local
machine overrides belong in `Local.xcconfig`. Do not add new credentials or
private tokens to documentation or committed configuration.

## Build and test

Open `AIShop/AIShop.xcodeproj` in Xcode, select the `AIShop` scheme, and run
on an iPhone or simulator. From the repository root, a command-line build is:

```zsh
xcodebuild -project ios/AIShop/AIShop.xcodeproj \
  -scheme AIShop -destination 'platform=iOS Simulator,name=iPhone 16 Pro' build
```

Run the XCTest suite by replacing `build` with `test`. Camera capture requires
a real device; request and state tests use controlled URL sessions and do not
require the production server.
