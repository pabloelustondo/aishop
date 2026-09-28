# Pattern: measured results

## Speaker notes

Show what was measured, not only that the tests passed.

A pass tells the reviewer the result. The numbers tell him how close it was.

In the example, the threshold sits in a gap about 0.1 wide.

That margin is what makes a later phone run low-risk, so it belongs on a slide.

Every figure comes from an evidence file, and the file is linked.

Never type a number from memory, and never round one into a different meaning.

State the host, the date, and the revision the numbers came from.

State what was not measured. Here that is the phone, a distractor, and general accuracy.

A saved snapshot is not a future pass. Say how to reproduce it.

Keep the evidence files with the deck, in step 9, and link each number to its file.

Report unflattering results plainly. A delay of 6.2 seconds is a finding, not a footnote.

## Fine print

- [Evaluation of the positive fixture](../../../09-build-test-document/basic-video-stream-object-recognition/artifacts/evidence/mac-positive/evaluation.json)
- [Session log with every score](../../../09-build-test-document/basic-video-stream-object-recognition/artifacts/evidence/mac-positive/session.jsonl)
- [Gate command](../../../../e2e/ios/run.zsh)
