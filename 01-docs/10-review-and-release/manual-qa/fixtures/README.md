# QA Media Fixtures

Store stable, unchanged photographs and videos used by manual regression cases here.

## Rules

- Use `QA-NNN-short-name.jpeg`, `.mp4` or `.mov`; the number must match its case document.
- Keep the received bytes unchanged so the recorded SHA-256 remains meaningful.
- Use JPEG for photographs; video accepts H.264 MP4 or QuickTime within the documented limits.
- Do not commit images containing credentials, private screens, or unnecessary people.
- Confirm contributor permission before retaining a WhatsApp-sourced photograph.
- Record provenance without phone numbers, chat contents, or other private metadata.
- Inspect video metadata before committing and remove sensitive location or device data only by creating a separately named, documented derivative.
- A replacement image is a new reviewed fixture or an explicit case revision.

Each media file must have a matching file under `../cases/` before it is approved.
