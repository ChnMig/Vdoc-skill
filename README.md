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

Clone this repository into the standard agent skill directory, with `SKILL.md` at the `vdoc` skill root:

```sh
# Personal installation, available to all workspaces
git clone --depth 1 https://github.com/ChnMig/Vdoc-skill.git "$HOME/.agents/skills/vdoc"

# Or install only for the current repository
git clone --depth 1 https://github.com/ChnMig/Vdoc-skill.git .agents/skills/vdoc
```

If the target already exists, update that existing checkout instead of cloning over it.

Pair it with the Vdoc MCP adapter from `Vdoc-mcp/`; the skill describes the workflow, while MCP provides the tools.

## Local Vdoc Closure Path

For a local Vdoc backend, Admin, MCP adapter, and Skill check that match the workspace docs, run from the workspace root:

```sh
scripts/vdoc-local-bootstrap.sh
docker compose --env-file .env up -d --build
cd Vdoc && go run ./tools/vdoc-demo-seed
```

The demo seed is optional. To verify live backend behavior against the root Compose stack:

```sh
cd Vdoc
./scripts/vdoc-e2e.sh live-compose --env-file ../.env --check-only
./scripts/vdoc-e2e.sh live-compose --env-file ../.env
```

Live E2E resets the selected disposable `VDOC_TEST_POSTGRES_DB`, `vdoc_e2e` by default. It does not reset the application database from `VDOC_POSTGRES_DB`.

Use the root release dry-run as the local gate before distributing the skill:

```sh
scripts/vdoc-release-dry-run.sh --list
scripts/vdoc-release-dry-run.sh
```

The dry-run does not publish packages or deploy services.

## Safety Rules

- Vdoc MCP is the source of truth for API contract facts and Markdown document content.
- Do not infer endpoint fields, parameters, response properties, enum values, auth schemes, servers, breaking-change claims, or Markdown text.
- Never print, copy, or log MCP tokens or JWTs.
- Never expose raw JWTs, MCP tokens, DB passwords, storage secrets, or `Authorization` header values in examples, logs, screenshots, issues, or final output.
- Direct publish tools are unavailable in v0.1; human Admin/SuperAdmin review publishes versions.

## Validate

```sh
npm test
```
