AI-MODIFIED - 2026-09-19T15:36Z

# AIShop iPhone App: Google Drive Working-Tree Synchronization

## Purpose

Allow ChatGPT Work to propose bounded repository-file changes through the
Google Drive folder that is synchronized with Pablo's Mac checkout.

## Workflow

1. Pablo selects the intended Git branch and confirms a clean working tree.
2. ChatGPT resolves the exact Drive-backed repository and target file.
3. ChatGPT changes ordinary working-tree files only; it never changes `.git`.
4. Google Drive synchronizes those file changes to Pablo's Mac.
5. Pablo verifies the result with `git status` and `git diff`.
6. Pablo stages, reviews, commits, and pushes the accepted changes.

## Safety boundaries

- Google Drive synchronization is file-based and has no awareness of branches.
- Do not edit the same file concurrently on the Mac and through Drive.
- Do not use this workflow while unrelated working-tree changes are present.
- Never manipulate `.git`, the index, commits, branches, remotes, or credentials.
- Start with one small file and confirm synchronization before broader edits.
- A synchronized file remains an unapproved proposal until Pablo commits it.

## Initial synchronization test

This file is the first controlled probe. Success means it appears at
`ios/AIShop/01-docs/11-operational-reality/google-drive-working-tree-sync.md`
on Pablo's Mac and appears as an untracked file in `git status`.
