# AIShop iPhone App: Operational Reality

## Expected constraints

- Simulator timing and compute do not represent a physical iPhone.
- Vision feature prints do not run in the iOS Simulator by default, so
  real-Vision tests run on macOS.
- Camera autofocus, exposure, stabilization, rolling shutter, and permissions
  require later device validation.
- Vision behavior can vary with OS, hardware, orientation, and image preprocessing.
- Continuous inference can consume battery, raise temperature, and throttle.
- Store lighting, glare, occlusion, packaging changes, and shelf density dominate
  real recognition quality.

## Runtime safeguards

- Bound memory, queues, frame dimensions, and analysis frequency.
- Cancel promptly when scanning stops or the app backgrounds.
- Keep raw media local by default and make any server transfer explicit.
- Record model and configuration versions with evidence.
- Treat low confidence as a request for better evidence, not an identity claim.

## Device-validation gate

Before any real shopping claim, test representative supported iPhones for camera
guidance, first-signal latency, sustained thermal behavior, energy use, memory,
background transitions, and recovery from interruption.
