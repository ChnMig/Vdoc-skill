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

Install the exact commit pinned by the workspace release lock into the standard
agent skill directory, with `SKILL.md` at the `vdoc` skill root:

```sh
# Personal installation; use .agents/skills/vdoc for repository scope instead.
VDOC_SKILL_DIR="$HOME/.agents/skills/vdoc"
VDOC_WORKSPACE_LOCK="${VDOC_WORKSPACE_LOCK:-../workspace.lock.json}"
VDOC_SKILL_COMMIT="$(jq -er '.repositories[] | select(.path == "Vdoc-skill") | .commit' "$VDOC_WORKSPACE_LOCK")"
printf '%s' "$VDOC_SKILL_COMMIT" | grep -Eq '^[0-9a-f]{40}$'
test ! -e "$VDOC_SKILL_DIR"
mkdir -p "$(dirname -- "$VDOC_SKILL_DIR")"
git init "$VDOC_SKILL_DIR"
git -C "$VDOC_SKILL_DIR" remote add origin https://github.com/ChnMig/Vdoc-skill.git
git -C "$VDOC_SKILL_DIR" fetch --depth 1 origin "$VDOC_SKILL_COMMIT"
git -C "$VDOC_SKILL_DIR" checkout --detach FETCH_HEAD
test "$(git -C "$VDOC_SKILL_DIR" rev-parse HEAD)" = "$VDOC_SKILL_COMMIT"
test -f "$VDOC_SKILL_DIR/SKILL.md"
```

The command derives its commit from the external reviewed lock so this
repository does not make an impossible self-referential claim about its own
future commit. If the target already exists, verify its current `HEAD`; upgrade
only by fetching and checking out the commit from a newer reviewed lock. Do
not use an unpinned `git pull` for an installed Skill. A standalone immutable
install channel is not claimed until a release tag or checksummed bootstrap is
published.

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
