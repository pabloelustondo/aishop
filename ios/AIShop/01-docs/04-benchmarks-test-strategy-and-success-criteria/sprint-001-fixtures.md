# AIShop iPhone App: Sprint 001 Fixtures

Currently in `ios/AIShop/AIShopTests/`. Tasks make the fixtures available to the
`AIShopVision` package tests and to the debug harness, including on a physical
iPhone. They never ship in a Release build.

| Role | File | Length |
|---|---|---|
| Reference image | `banana.JPG` | — |
| Positive video | `video_with_banana_trimmed.mov` | 27.5 s |
| Negative video | `video_without_banana_trimmed.mov` | 13.0 s |
| Distractor video | not yet supplied | — |

## Origin

Filmed by Pablo on an iPhone 17 on 2026-09-19, per file metadata; his own
footage. The videos are cut from the originals (10.0–37.5 s and 0.5–13.5 s) and
re-encoded: H.264, 1080×1920, 30 fps, no audio, stored upright with no rotation
flag. The untrimmed originals are not fixtures.

## Annotation of the positive video

| Interval (s) | Visible | Zone |
|---|---|---|
| 0–10.0 | Thermos, gourd, laptop, table; no banana | False positive |
| 10.0–11.0 | Sliver of banana at the left edge | Do not care |
| 11.0–15.2 | Table only | False positive |
| 15.3–18.2 | Sliver of banana at the bottom edge | Do not care |
| 18.3–27.5 | Whole banana in frame, largest at 23–26 s | Expected interval |

The whole negative video is a false-positive zone. The annotation is fixed
before any threshold is chosen and is not adjusted to fit results.

## Known properties

- The positive video ends with the banana in frame, so its episode closes at
  end of stream, never on a gap.
- At its largest the banana covers about a tenth of the frame, against about a
  quarter in the reference image.
- The reference image is mostly the same wood table seen in both videos, so
  table-only frames may score close to it. The margin between expected-interval
  frames and table-only frames is the measurement to record.
- The negative video was filmed at night and the positive in daylight; the
  daylight table-only zones are the better-controlled negative.
- `banana.JPG` is stored rotated with an EXIF orientation flag, which the loader
  must honor.
