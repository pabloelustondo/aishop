# Vision Agent Video Processing Pipeline

A completed upload becomes a server-owned background analysis.

- The client reserves a record, sends video bytes to Storage, and confirms completion.
- Cloud Tasks invokes a video worker with owner, analysis, and attempt identifiers.
- FFmpeg extracts representative JPEG frames from the original source.
- One background model request treats the frames as a single shelf scan.
- A collector settles the report in Firestore; the client reads it through GET.

Frame timestamps remain evidence for review and cross-frame counting.
