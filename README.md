# Vdoc Skill

Vdoc Skill is the installable agent workflow package for Vdoc. It teaches AI agents when and how to use Vdoc MCP for API contract facts, Markdown document facts, endpoint integration, migration analysis, and draft submission.

The skill does not store data, compute diffs, or talk to Vdoc directly. Vdoc MCP is the source of truth for tools and facts.

## Contents

```text
SKILL.md
templates/
  endpoint-integration.md
  frontend-change-summary.md
examples/
  endpoint-query-example.md
  compare-versions-example.md
```

## Install

Install this directory as a skill in your agent runtime. For agents that use a skills folder, copy or link this repository as the `vdoc` skill folder so that `SKILL.md` is at the skill root.

Pair it with the Vdoc MCP adapter from `Vdoc-mcp/`; the skill describes the workflow, while MCP provides the tools.

## Safety Rules

- Vdoc MCP is the source of truth for API contract facts and Markdown document content.
- Do not infer endpoint fields, parameters, response properties, enum values, auth schemes, servers, breaking-change claims, or Markdown text.
- Never print, copy, or log MCP tokens or JWTs.
- Direct publish tools are unavailable in v0.1; human Admin/SuperAdmin review publishes versions.

## Validate

```sh
npm test
```
