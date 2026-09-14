# QA Image Fixtures

Store stable, unchanged photographs used by the manual regression cases here.

## Rules

- Use `QA-NNN-short-name.jpeg`; the number must match its case document.
- Keep the received bytes unchanged so the recorded SHA-256 remains meaningful.
- Prefer JPEG because the current analysis upload contract requires JPEG evidence.
- Do not commit images containing credentials, private screens, or unnecessary people.
- Confirm contributor permission before retaining a WhatsApp-sourced photograph.
- Record provenance without phone numbers, chat contents, or other private metadata.
- A replacement image is a new reviewed fixture or an explicit case revision.

Each image must have a matching file under `../cases/` before it is approved.
