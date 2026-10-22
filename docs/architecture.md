# The full Prosekeep editorial system

Prosekeep 0.3.0 makes Vloora's editorial method reusable while letting each adopter define its own voice and policy.

## Components

| Layer | Location | Responsibility |
| --- | --- | --- |
| Referenced standards | `skills/prosekeep/references/standards/` | Source-linked guidance adapted from 18F, Digital.gov, GSA, accessibility guidance and Prosekeep's evidence/editing methods |
| Editorial authority | `templates/EDITORIAL.md`, project `EDITORIAL.md`, positioning and agent instructions | Defines owner decisions, content strategy, page roles and evidence thresholds |
| Document models | `skills/prosekeep/references/document-roles.md`, `content-model.md`, `style-mechanics.md` | Homepage, product, essay, case study, research, discussion paper, technical writing, guides, news and interface copy |
| Mechanical checker | `src/check.mjs` | Seven established configurable checks, including changed-line auditing |
| Structure and fidelity | `src/editorial.mjs` | Heading and HTML-alt preflight, numerical/URL/citation differences, exact cross-page repeated-paragraph detection |
| Review process | `skills/prosekeep/references/review.md` | Multi-pass semantic editorial workflow, publishing checks and verifiable signoff criteria |
| CLI | `bin/prosekeep.mjs` | `init`, `check`, `audit`, `compare`, `outline`, `standards`, `review`, `skill` |
| MCP | `src/mcp.mjs` | Local read-only tools and prompts; agents perform judgment themselves |
| Release/CI | `.github/workflows/test.yml` and adopter workflows | Tests, package inspection and source-first publishing checks |

## Precedence

Owner or author directions take precedence over local policy; local policy controls its own voice, document types and mechanics; external references are a basis for review where those rules are silent. Relevant legal and accessibility duties remain independently applicable. Machine warnings cannot override a person or verify external facts.

## What cannot be automated by a regex

An accurate attribution, a meaningful headline, a reader's ability to understand a page, a product claim's truth and fidelity to an author's argument all require source material and editorial judgment. `review_document` returns prompts and mechanical findings, rather than pretending to perform an independent semantic assessment. `check_source_fidelity` flags changes only to numerical tokens, URLs and numeric citations, not factual validity. Whole-site maintenance also requires actual routes, sources, builds, browser checks and editorial owners.

## Applying it to Vloora

The Vloora profile enables all seven original regex rules and includes the sourced standard references. It does not bundle `POSITIONING.md`, brand copy, private site instructions, or the site-specific Python generator. Keep the original Vloora rules and CI active until a separate migration verifies parity. See `docs/vloora-parity.md` and `examples/vloora/`.
