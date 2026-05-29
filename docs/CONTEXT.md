# Docs Workspace
> Scaffold template — fill in per product. Structure of record is the
> SaaS Master Framework (see /CLAUDE.md and /SCAFFOLD-NOTES.md).

## What happens here
This workspace is for documentation that lives alongside the code. API references, user guides, and the changelog live here. When Claude is in this workspace, it is writing or updating documentation — not code.

## Documentation standards
- [e.g. "Write for a developer audience — assume they know their tools"]
- [e.g. "Every API endpoint gets a request example and a response example"]
- [e.g. "Changelog entries follow Keep a Changelog format"]

## Audience
- API docs: [Who reads them? e.g. "External developers integrating our API"]
- Guides: [Who reads them? e.g. "Internal team onboarding to the project"]
- Changelog: [Who reads it? e.g. "End users and stakeholders tracking releases"]

## How docs relate to code
- [e.g. "API docs must be updated whenever a route is added or changed"]
- [e.g. "Changelog entry required for every PR merged to main"]

## Folder guide
- /api — Endpoint documentation, one file per major resource
- /guides — Step-by-step guides for setup, workflows, and common tasks
- /changelog — Release notes, one file per version or one running file
