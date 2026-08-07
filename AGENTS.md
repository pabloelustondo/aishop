# AI Shop Agent Rules

These rules apply throughout this repository.

## Human-validated artifacts

- A filename ending in `-ha` immediately before its extension means that a human validated the exact current contents.
- Only Pablo's explicit instruction to mark an artifact as human validated authorizes adding `-ha`.
- Never infer human validation from praise, acceptance, silence, or completed work.
- Do not modify a human-validated artifact directly.
- Before changing one, remove `-ha` from its filename and tell Pablo that its validation has been removed.
- After making changes, leave the artifact without `-ha`. Only a new explicit human validation can restore it.
- Human validation applies only to the artifact's contents. It does not authorize implementation, deployment, publication, or release.
- Files named `README.md` or `AGENTS.md` are excluded from this naming rule and retain their conventional names.
- Changes to `AGENTS.md` still require Pablo's explicit instruction.

## Coding gate

- Do not create or modify executable code unless the active sprint has at least one human-validated sprint plan whose filename ends in `-ha`.
- Every additional planning document that defines the authorized implementation scope must also be human validated before coding starts.
- If an approved plan still says implementation is not authorized, require Pablo's separate explicit authorization to begin.
- Plan approval authorizes only its defined implementation scope; it does not prove testing, review, release, or deployment.

## Document size

- Keep each textual project document at or below 50 physical lines, including blank lines.
- Prefer one focused, readable purpose per document.
- When more space is needed, split the material into small, clearly named fragments instead of growing one large document.
- Do not compress content into dense or unreadable lines merely to satisfy the limit.
- Check the line count before treating document work as complete.
- If an existing document exceeds 50 lines, do not expand it. Split or simplify it as part of the next authorized change to that document.
