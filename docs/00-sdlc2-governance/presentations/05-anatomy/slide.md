# Anatomy of a presentation

## One folder, one index, one folder per slide

```text
my-presentation/
    README.md               index of slides; status; what it describes
    01-title/
        slide.md            the visual: Markdown, Mermaid, SVG, or other
        speaker-notes.md    at most 50 lines; ends with Fine print
    02-.../
        slide.md
        speaker-notes.md
    artifacts/              optional: evidence the slides cite; exports
    tools/                  optional: a generator or a check script
```

The first slide is always a title and a subtitle. A type fixes the rest of the order.
