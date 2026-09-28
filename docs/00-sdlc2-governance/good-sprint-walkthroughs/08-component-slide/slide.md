# Pattern: a component slide

## Example: the episode aggregator of iPhone Sprint 001

| | |
|---|---|
| **Responsibility** | Turn per-frame support decisions into candidate episodes |
| **Takes in** | One score per sampled frame, in media-time order |
| **Gives out** | Episode opened, best frame replaced, episode closed |
| **Must never** | Open on a single frame; use wall-clock time; merge sightings across a closed gap |
| **Interface, in words** | Consume one score and get back the changes; finish with a reason |
| **When it fails** | An out-of-order sample is an error, never a guess |
| **Proved by** | Aggregator unit tests; integration tests for stop and end of stream |
