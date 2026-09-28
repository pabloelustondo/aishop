# Pattern: where to look hardest

## Example: weak spots of iPhone Sprint 001, as found in review

1. **Harness replay and calibration disagree about dropped frames.** The harness
   runs only paced replay; calibration rejects any log with a dropped frame.
2. **One app test depends on the scheme.** It passes under the diagnostics scheme
   and fails by design under the ordinary one.
3. **The harness opens only from Xcode.** Tapping the icon on the phone starts the
   normal app with sign-in.
4. **Rotated video is handled the wrong way round.** Hidden today because the
   fixtures are stored upright.
