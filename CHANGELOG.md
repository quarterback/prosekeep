# Changelog

## 0.3.0 — October 2026

Prosekeep expands the 0.2.0 Agent Skill, command-line checker and local MCP server into a reusable, author-controlled editorial suite.

### Added

- Source-linked reference modules adapted from the 18F Content Guide, Digital.gov plain-language guidance, GSA content standards, and accessible-content guidance, with evidence and publishing methods.
- Editable project policy through `EDITORIAL.md` and `.editorial.json`, with `default`, `vloora` and `public-service` profiles.
- Document models for product pages, research, essays, case studies, interfaces, news, technical notes and guides.
- A five-pass editorial review protocol covering purpose, voice, claims, mechanics and release checks.
- `standards`, `outline`, `audit`, `compare` and `review` commands alongside existing CLI checks.
- MCP tools for document review, page structure, source-fidelity comparison, content audits, applicable standards and project policy.
- Exact duplicate-paragraph reporting, basic heading and HTML-image-alt preflight, and change reporting for URLs, numbers and numbered citations.
- Regression tests and release checks covering editorial behavior and local-file access boundaries.

### Important limits

The CLI and MCP tools return deterministic diagnostics, selected guidance and review prompts. They do not independently validate facts, evaluate whether an argument is sound, or certify plain-language or accessibility compliance. An author or agent must examine the sources and perform the semantic review.

Vloora-specific publishing logic, positioning, Vale configuration and site checks remain in Vloora's own repository. See [the parity report](docs/vloora-parity.md) before replacing existing project checks.

### Install

```sh
npx --yes prosekeep@0.3.0 --help
npx skills add quarterback/prosekeep --skill prosekeep
```

This entry describes the source release. npm publication must be verified separately with `npm view prosekeep@0.3.0 version`.
