# Pattern: the fine-print index

## Speaker notes

The index is the last page of the deck, and nobody presents it.

It maps every file the sprint changed to the slide whose fine print holds it.

The list of files comes from git: everything changed since the sprint's base commit.

That removes any argument about which files belong to the feature.

A file with no slide is either explained somewhere, or listed as not covered with a reason.

Generated files, lock files, and binary fixtures are the usual honest exceptions.

The index is a backstop. It catches a file that nobody explained.

It is not the goal. A deck can map every file and still explain nothing.

So check the logical elements first, and the index second.

A small script can compare the index with git and fail on a missing file.

Put that script beside the deck, so the reviewer can run it too.

## Fine print

- [Sprint 001 deck index](../../../09-build-test-document/basic-video-stream-object-recognition/README.md)
