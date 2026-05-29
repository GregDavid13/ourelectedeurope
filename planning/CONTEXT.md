# Planning Workspace
> Scaffold template — fill in per product. Structure of record is the
> SaaS Master Framework (see /CLAUDE.md and /SCAFFOLD-NOTES.md).

## What happens here
This is where features get defined before any code is written. Specs live in /specs, system design in /architecture, and rationale behind big decisions in /decisions.

When Claude is working here, the job is to think through the problem, document constraints, and produce clear written outputs — not to write code.

## Current priorities
- [ ] [Feature or decision currently being scoped]
- [ ] [Next feature in the queue]
- [ ] [Open architectural question to resolve]

## How this workspace is used
1. A new feature starts as a spec in /specs — what it does, who uses it, what success looks like, what's out of scope.
2. If the feature touches system design, a doc goes in /architecture describing the approach.
3. If a meaningful decision was made (and why), a short ADR goes in /decisions.

## What good output looks like
- Specs are written so a developer who knows nothing about this project can pick them up and build without asking questions.
- Architecture docs describe the "why" not just the "what."
- Decision records are short: the context, the options considered, the decision made, and the consequences.
- No filler. No padding. If a sentence doesn't add information, cut it.

## What to avoid
- Writing specs that describe how to build something (that belongs in /src CONTEXT.md)
- Leaving decisions undocumented if it was worth debating, it's worth recording
- Updating architecture docs to reflect the future instead of the present
