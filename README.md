# Prosekeep

**A full editorial system for teams that write with AI agents.** Prosekeep carries an author's editorial decisions, content standards, evidence requirements, and publishing workflow across repositories and agent tools. Built from the editorial system Vloora developed while building and publishing its own software and research.

Prosekeep combines a portable Agent Skill, source-linked editorial standards, configurable house style, deterministic checks, a review protocol, an npm CLI, and a local MCP server. It helps an agent review prose without turning an author's argument into generic AI writing.

Read the [0.3.0 release notes](CHANGELOG.md) for the expanded editorial suite.

## Install

Install the Agent Skill anywhere its format is supported:

```sh
npx skills add quarterback/prosekeep --skill prosekeep
# global agent installation
npx skills add quarterback/prosekeep --skill prosekeep -g
```

Use the npm CLI from a project (Node 20+):

```sh
npx prosekeep@0.3.0 init
npx prosekeep@0.3.0 standards
npx prosekeep@0.3.0 check .
npx prosekeep@0.3.0 audit writing/
npx prosekeep@0.3.0 review writing/essay.md
npx prosekeep@0.3.0 compare original.md revised.md
```

The versioned npm commands require `prosekeep@0.3.0` to be published. Check availability with `npm view prosekeep@0.3.0 version`. If the release is not available, run `node bin/prosekeep.mjs` in a repository checkout.

`init` creates `.editorial.json` and an editable `EDITORIAL.md`. Nothing overwrites an existing policy file. Choose `--profile default`, `--profile vloora`, or `--profile public-service`; a project can select a different combination of standards and enable or disable individual mechanical rules. The adopter controls its own voice, page roles, terminology and substantive decisions. An organization's applicable legal obligations remain separate.

## What the full suite contains

| Component | Job |
| --- | --- |
| **Source-linked standards** | Adapted guidance from [18F](https://guides.18f.org/content-guide/), [Digital.gov plain language](https://digital.gov/guides/plain-language), [GSA content standards](https://www.gsa.gov/reference/gsa-web-style-guide/content-standards), and [USWDS accessibility](https://designsystem.digital.gov/design-principles/). Includes evidence and publishing methods. |
| **Editorial authority** | `EDITORIAL.md`, project positioning and agent instructions set voice, decisions, page responsibilities and priority over external suggestions. |
| **Document models** | Examples for homepages, product pages, essays, research, case studies, technical notes, discussion papers, interfaces, news and guides. |
| **AI-writing review** | A structured assessment of staged intros, generic closers, artificial contrasts, forced triads, jargon, vague claims and other patterns. Honors the author's own register. |
| **Mechanical checks** | Seven configurable line-based checks; separate outline scan, exact duplicated-paragraph report and before/after numerical/URL/citation differences. |
| **Review and publishing** | Read the headings as an outline, inspect sources and factual status, revise from the original, verify rendered pages and record owner signoff. |
| **Distribution** | SKILL.md, CLI, MCP server, GitHub test workflow and profiles, with no external AI API dependency. |

See [the architecture](docs/architecture.md) and [Vloora extraction/parity report](docs/vloora-parity.md).

## What actually happens during review

Prosekeep has **two distinct kinds of evaluation**.

1. **Deterministic preflight:** The CLI and MCP report matching language patterns, headings, basic HTML alt attributes, exactly repeated normalized paragraphs, and changes to measurable tokens between source and draft. These are reproducible diagnostics, not proof of errors.
2. **Editorial judgment:** An agent using the Skill, or an author, performs semantic review against the full project policy and selected reference standards. It must verify claims against the underlying sources, preserve distinctive voice, and distinguish evidence states. `review` and `review_document` provide the prompts and evidence needed for that process; no model is called automatically.

A passing check does not prove that text is accurate, accessible, original, comprehensible to actual readers, or acceptable to its author. Prosekeep is not an AI-text detector or an official federal compliance tool.

## CLI commands

```text
prosekeep init [--profile default|vloora|public-service]
prosekeep check [paths...] [--profile NAME] [--changed --base REF] [--json]
prosekeep audit [paths...] [--profile NAME] [--json]
prosekeep compare ORIGINAL REVISED [--json]
prosekeep outline FILE [--json]
prosekeep standards [ID] [--profile NAME] [--json]
prosekeep review [FILE] [--profile NAME] [--json]
prosekeep skill [--out DIR]
```

`check` uses original STYLE-01 through STYLE-07 rules: stock AI vocabulary, staged introductions, formulaic contrasts, prose dashes (numeric ranges excluded), month-first date convention, vague link labels and generic section headings. The `default` and `public-service` profiles leave dash style and US month-first dates disabled unless selected by the project; the Vloora profile enables them. The human or agent reviewer may override other suggestions where the writing requires it.

`audit` checks document outlines and reports exact normalized duplicate paragraphs across source files. `outline` checks heading gaps and repetitions, multiple H1 tags and HTML image tags missing alt attributes. These checks do not certify accessibility. `compare` flags additions or removals of URL tokens, numbers or numeric citations; it cannot know whether a changed fact is correct or detect every factual rewrite. `standards` reads the bundled reference files locally. `review` with a file produces a structured preflight; without one it prints the complete review protocol.

The `--changed` flag checks added lines from a Git comparison against `--base`, excluding untracked files. Use a full-file audit before publishing files newly created but not yet committed. The ordinary scan handles Markdown, MDX, HTML and plain text and skips front matter and code fences. Project builds, front-matter schemas, publishing paths and SEO rules remain project-specific.

## Use through MCP

To use the published 0.3.0 package, configure a local stdio MCP client:

```json
{
  "mcpServers": {
    "prosekeep": {
      "command": "npx",
      "args": ["-y", "--package=prosekeep@0.3.0", "prosekeep-mcp"]
    }
  }
}
```

For local development, run `node /absolute/path/to/prosekeep/bin/prosekeep-mcp.mjs`. The host starts it with a working directory. `check_file` is limited to a file inside that directory, with realpath checks against symlink escape. No Prosekeep tool writes files, commits changes, uploads text, or contacts a remote LLM. Passing text to an MCP client still subjects it to that client's own data-handling policy.

| MCP tool | Function |
| --- | --- |
| `check_text` | Check supplied text against the selected mechanical rules. |
| `check_file` | Check a permitted local file. |
| `review_document` | Return structure and mechanical findings plus a task-specific semantic review checklist. |
| `review_page_structure` | Inspect headings and HTML alt attribute presence. |
| `check_source_fidelity` | Flag numeric, URL and numbered-reference differences between two drafts. |
| `audit_content` | Preflight up to 25 supplied documents and report exact repeated paragraphs. |
| `get_applicable_standards` | Return selected source-linked guidance, or specific requested modules. |
| `get_project_policy` | Read local policy, positioning and agent instructions when present. |
| `get_review_guide` | Return the qualitative review protocol. |

The server also exposes an `editorial_review` prompt and resources for the review guide, project policy and selected standards. The full reference material ships with the Agent Skill as well, so agents can work without MCP.

## External standards and ownership

The 18F Content Guide is a U.S. government public-domain/CC0 resource and explicitly encourages adaptation. We wrote independent, condensed reference modules with direct links to their sources. Digital.gov now hosts a plain-language guide adapted from PlainLanguage.gov. GSA's house rules are applicable to GSA properties; other teams can use them as references while maintaining their own policies. W3C and USWDS accessibility references guide human review, and Prosekeep does not claim compliance testing.

Vloora's own style manual, detailed publisher positioning, Vale configuration, website generator and regression suite remain in the Vloora repository. The `vloora` profile demonstrates preferences, not a claim of full site migration. Read [the parity audit](docs/vloora-parity.md) before replacing any of those site checks.

## Development and publishing

```sh
npm test
npm run check
npm pack --dry-run
```

CI runs the test suite, clean example and package inspection. [npm release instructions](docs/npm-release.md) describe publishing version tags through the GitHub Actions workflow using npm trusted publishing. A maintainer can also publish from an authenticated, tested checkout:

```sh
npm publish --access public
```

Check public availability from outside the repository with `npm view prosekeep@0.3.0 version` and `npx --yes --package=prosekeep@0.3.0 prosekeep --help`. Test `prosekeep-mcp` through an actual MCP client before reporting client compatibility.

## License and attribution

Prosekeep is distributed under **CC0 1.0 Universal** (see `LICENSE`). External standards and third-party tools retain their respective attribution, licensing and authority. Prosekeep is an independent Vloora project and is not endorsed by 18F, GSA, W3C or any referenced publisher.
