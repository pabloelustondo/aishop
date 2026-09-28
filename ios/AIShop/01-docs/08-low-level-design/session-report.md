# AIShop iPhone App: Session and Evaluation Reports

Conceptual, like the [component contracts](component-contracts.md): these become
Swift types only after the Sprint 001 plan and tasks are approved.

## `SessionReport`

- Built when the user stops or the stream ends, from evidence retained while
  streaming. There is no second pass over the media: a live camera has no file
  to revisit, and the pipeline must not depend on its source.
- One row per closed episode: product ID, interval, best-frame timestamp, best
  score, supporting-frame count, matched variant (whole frame or central crop),
  evidence state, and the retained best-frame image.
- Session totals: frames received, analyzed, and dropped; processing latency.
- Rows are episodes, not unique items. The same product seen twice is two rows
  until Sprint 004 adds tracking and deduplication.
- It shows the best frame, not a crop around the product. Localization arrives
  with Sprint 002 candidate regions.

## `EvaluationReport`

- Exists only in tests. It compares a session report with a fixture annotation.
- Per fixture: whether an episode opened inside the expected interval, the delay
  from interval start to first signal, episodes opened in false-positive zones,
  and the score margin between expected-interval and false-positive frames.
- Accuracy is reported here and nowhere else. A score is neither an accuracy nor
  a probability, and the session report never presents it as one.

## Best-frame retention

- Each open episode keeps the image of its best frame and replaces it when a
  higher-scoring frame arrives.
- A later option, not Sprint 001: a short ring buffer of recent frames, searched
  densely around the best timestamp. It works for camera and file alike.
