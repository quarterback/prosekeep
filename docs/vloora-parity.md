# Extraction audit: Vloora to Prosekeep

Source of the method: `quarterback/vloora` at the time of extraction, especially `guides/style/source.md`, `docs/house-style-review.md`, `docs/editorial-workflow.md`, `scripts/check_house_style.py`, `scripts/check-positioning.py`, its Vale workflow, and the humanizer skill. These files change independently of Prosekeep; review them again before migrating a site.

| Vloora component | Prosekeep 0.3.0 | Remaining project-specific work |
| --- | --- | --- |
| Voice and audience | Author policy template, editorial skill, 18F guidance | Populate with real editorial examples and author priorities |
| Seven mechanical checks | `src/check.mjs`, `vloora` profile | Original check includes bespoke data and template source scopes; retain Vloora script until compared |
| Heading and document anatomy | `document-roles.md`, outline scanner, review protocol | Validate rendered routes, front matter, generated indexes and canonical URLs through site generator |
| Style mechanics | Sourced reference modules and project policy | Vloora's dates/percent conventions remain in Vloora `guides/style/source.md` |
| Humanizer and AI patterns | `ai-writing.md` and references, qualitative checklist | Separate upstream humanizer skill provides deeper examples; do not claim it is bundled |
| Evidence and product claim review | Evidence states, fidelity differ, editorial protocol | Agent or human must compare to real product source and records |
| Positioning protection | Precedence contract, reads `POSITIONING.md` | Vloora's exact category and strategy regression tests remain local |
| Vale and review CI | GitHub test workflow, documented publishing checkpoints | Vloora's Vale config, build, positioning checks and PR policy remain local |
| Page and site publishing | Structured review and duplicate-content scan | Layout, navigation, 200% zoom, accessibility, source synchronization and responsive checks belong in the site's own tests |

Prosekeep is an independent portable method, not an official federal-government style guide. No migration may silently change Vloora's own policy or replace its source-of-truth checker until feature parity is demonstrated by shared fixtures and end-to-end tests.
