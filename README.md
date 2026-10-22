# Prosekeep

A portable editorial system for AI-assisted writing: a reusable Agent Skill and a deterministic copy checker. Derived from the editorial workflow built for Vloora. Works with other repositories, writers, and organizations by taking the author's voice and project-specific instructions as inputs.

The central rule: **preserve the author's argument and decisions**. Checkable language patterns are a small part of editorial review. The skill instructs agents to review document structure, evidence, register, and fidelity to source material. The CLI checks seven patterns that can be recognized without a language model.

## Use it as an agent skill

Install Prosekeep from the public GitHub repository with the open skills CLI:

```sh
npx skills add quarterback/prosekeep --skill prosekeep
```

You can install it globally using `-g`, or into a project for its agents. The skill lives at `skills/prosekeep/SKILL.md` and can also be copied into a repository’s local agent skills directory.

## Use the npm checker

After its first npm publication:

```sh
npx prosekeep init
npx prosekeep check .
npx prosekeep check writing/announcement.md
npx prosekeep check --changed --base origin/main
npx prosekeep review
npx prosekeep skill --out .agents/skills
```

For a source checkout, substitute `node bin/prosekeep.mjs` for `npx prosekeep`. The `skill` command copies the skill files into the destination, and will not overwrite an existing skill. `init` creates `.editorial.json` and, if absent, an `EDITORIAL.md` you can fill in for the project. It does not overwrite an existing file. Set `profile`, `includeExtensions`, `exclude`, or `rules` in that file. Every rule can be disabled by setting its key to `false`.

### The seven checks

| Rule | What it catches |
| --- | --- |
| STYLE-01 | A small set of stock AI vocabulary |
| STYLE-02 | Staged openers and generic setup phrases |
| STYLE-03 | Formulaic `not X but Y` contrasts |
| STYLE-04 | Em/en dashes used in prose (numeric ranges excepted) |
| STYLE-05 | Day-first prose dates for month-first editorial styles |
| STYLE-06 | Generic Markdown and HTML link text |
| STYLE-07 | Generic section headings |

The `default` profile disables the punctuation and date-order checks (STYLE-04 and STYLE-05); these are editorial conventions rather than universal defects. The `vloora` profile enables all seven rules. `.editorial.json` determines the default profile for a given repository.

These checks are configurable. They do not detect misinformation, plagiarism, harmful content, incoherent arguments, authenticity, or source fidelity. `review` displays the semantic checklist; the skill tells an agent how to perform that review. There is no AI API dependency and no claim that the CLI performs automated semantic editing.

`--changed` checks added lines in committed changes relative to `--base` and is suitable for a PR workflow. Untracked, uncommitted new files are not included by `git diff BASE` until staged/committed; run a full file audit for those. By default, the linter examines Markdown, MDX, HTML, and text files and skips code fences, front matter, and quoted paragraphs. Customize file scopes for your own project.


## MCP: use the same editorial rules from your AI agent

The npm package also contains a local stdio MCP server, `prosekeep-mcp`. It implements the core MCP tool, resource, and prompt exchanges using Node's standard library, with no external API or runtime dependency. All checks execute on your machine. The server never edits files, commits changes, uploads prose, or contacts an LLM.

For a client that supports MCP stdio servers, add this configuration (after publishing to npm):

```json
{
  "mcpServers": {
    "prosekeep": {
      "command": "npx",
      "args": ["-y", "--package=prosekeep@0.2.0", "prosekeep-mcp"]
    }
  }
}
```

In a source checkout, use `node /absolute/path/to/prosekeep/bin/prosekeep-mcp.mjs` instead of `npx`. The MCP process starts in the project directory selected by its host. For `check_file`, only files physically inside that directory are accessible. Size limits prevent unexpectedly large text from being returned to a model.

Available tools:

- `check_text`: validate supplied text against the selected profile. Returns line-level mechanical findings.
- `check_file`: read and check a file beneath the process's working directory.
- `get_project_policy`: return the project's local `EDITORIAL.md` and `.editorial.json` if present.
- `get_review_guide`: return the semantic editorial checklist.

Also includes a reusable `editorial_review` MCP prompt and read-only resources for general guidance and the project's local policy. When a model uses the prompt, it still must exercise its own editorial judgment; MCP itself does not generate revisions.

The server implements baseline local MCP message exchanges including tools/list, tools/call, resources/list, resources/read, prompts/list, and prompts/get. Compatibility with individual hosts should be tested before a public release; this early version has local protocol tests.

## Why Vloora shared it

Prosekeep originated in Vloora's own writing and release workflow. Repeated agent edits made it clear that a style manual is most effective when it is executable, portable between repositories, and subordinate to the author's decisions. Vloora made this small tool available so other teams can use the approach in their own projects with their own style rules.

## Repo structure

```text
skills/prosekeep/SKILL.md             agent method and activation description
skills/prosekeep/references/  semantic review and document types
src/check.mjs                       dependency-free language checker
bin/prosekeep.mjs                    CLI
bin/prosekeep-mcp.mjs                local stdio MCP server
profiles/                            editor-selected check preferences
examples/                            before/after specimens
```

## Publish and verify

1. Run `npm test`, `npm run check`, and `npm pack --dry-run` in this repository.
2. Install the skill with `npx skills add quarterback/prosekeep --skill prosekeep` and validate it in a separate project after this pull request is merged.
3. Verify npm package name availability and registry account access, then publish with `npm publish --access public`. Publishing requires npm authentication and any configured two-factor or trusted-publishing approval.
4. Test `npx prosekeep` and the local MCP server from the published package in a second repository. Public directory indexing may take time and is not guaranteed.

This standalone 0.2.0 implementation is not a drop-in replacement for Vloora's existing Python site-source lint and CI scripts. Retain those until regression checks cover its bespoke HTML template attributes, news data, and source-generation rules.

This package intentionally excludes Vloora's unlisted, internal style manual, company positioning memo, and private repo content. The portable method can be shared without publishing confidential or company-specific decisions.

## License

CC0 1.0 Universal. See LICENSE.
