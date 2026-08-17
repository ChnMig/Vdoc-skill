import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(new URL("../package.json", import.meta.url)));

const requiredSkillFiles = [
  "SKILL.md",
  "templates/frontend-change-summary.md",
  "templates/endpoint-integration.md",
  "examples/compare-versions-example.md",
  "examples/endpoint-query-example.md",
];

const v01ToolSchemas = new Map([
  ["list_projects", { required: [], optional: [] }],
  ["list_documents", { required: ["project_id"], optional: [] }],
  ["list_api_versions", { required: ["project_id", "document_id"], optional: [] }],
  ["list_doc_versions", { required: ["project_id", "document_id"], optional: [] }],
  ["get_latest_schema", { required: ["project_id", "document_id"], optional: ["branch_id"] }],
  ["get_endpoint_detail", { required: ["project_id", "document_id", "version_id", "endpoint_id"], optional: [] }],
  ["compare_api_versions", { required: ["project_id", "document_id", "from_version_id", "to_version_id"], optional: [] }],
  ["get_change_summary", { required: ["project_id", "document_id", "diff_id"], optional: [] }],
  ["create_api_version_draft", { required: ["project_id", "document_id", "branch_id", "version_name", "schema_content"], optional: ["changelog", "source_git_commit_id"] }],
  ["update_api_version_draft", { required: ["project_id", "document_id", "draft_id", "schema_content"], optional: ["version_name", "changelog", "source_git_commit_id"] }],
  ["submit_api_version_draft", { required: ["project_id", "document_id", "draft_id"], optional: [] }],
  ["get_api_version_draft", { required: ["project_id", "document_id", "draft_id"], optional: [] }],
  ["get_latest_doc", { required: ["project_id", "document_id"], optional: ["branch_id"] }],
  ["compare_doc_versions", { required: ["project_id", "document_id", "from_version_id", "to_version_id"], optional: [] }],
  ["create_doc_draft", { required: ["project_id", "document_id", "branch_id", "version_name", "markdown_content"], optional: ["changelog", "source_git_commit_id"] }],
  ["update_doc_draft", { required: ["project_id", "document_id", "draft_id", "markdown_content"], optional: ["version_name", "changelog", "source_git_commit_id"] }],
  ["submit_doc_draft", { required: ["project_id", "document_id", "draft_id"], optional: [] }],
  ["get_doc_draft", { required: ["project_id", "document_id", "draft_id"], optional: [] }],
]);

test("Vdoc skill required content is present and safe", () => {
  const combined = requiredSkillFiles.map(readRootFile).join("\n");
  const skill = readRootFile("SKILL.md");

  for (const phrase of [
    "Vdoc MCP is the source of truth for API contract facts",
    "Do not infer or hallucinate endpoint fields, parameters, response properties, enum values, auth schemes, servers, breaking-change claims, or Markdown text",
    "Always call JSON-RPC `tools/list` if unsure",
    "Use `document_id` for API and Markdown document tools",
    "Before comparing published Markdown versions, call `list_doc_versions`",
    "You must call `get_endpoint_detail` before generating endpoint integration code or client types",
    "You must call `compare_api_versions` before migration advice or frontend impact analysis",
    "draft tools only",
    "Human Admin/SuperAdmin review publishes versions",
    "Direct publish tools are unavailable in v0.1",
    "Use `markdown_content` for Markdown draft content",
    "Output must distinguish `must_handle` / breaking changes from optional/non-breaking changes",
    "Never print, copy, or log MCP tokens or JWTs",
    "Never include Authorization headers in final output",
  ]) {
    assert.match(skill, escapeRegExp(phrase), `missing required phrase: ${phrase}`);
  }

  for (const toolName of v01ToolSchemas.keys()) {
    assert.match(combined, new RegExp(`\\b${toolName}\\b`), `missing v0.1 tool: ${toolName}`);
  }

  assertNoDirectPublishTools(combined);
  assertNoRemovedTerms(combined);
  assertNoSecrets(combined);
  assertTemplateTerms("templates/frontend-change-summary.md", ["must_handle", "is_breaking", "breaking", "optional", "non-breaking", "location", "message", "old_value", "new_value", "frontend_impact"]);
  assertTemplateTerms("templates/endpoint-integration.md", ["get_endpoint_detail", "method", "path", "operationId", "parameters", "request body", "responses", "security", "servers", "required fields", "enum values"]);

  assert.equal(requiredSkillFiles.length, 5);
  assert.equal(v01ToolSchemas.size, 18);
});

test("Vdoc skill JSON-RPC examples use valid v0.1 tool payloads", () => {
  for (const path of requiredSkillFiles) {
    const body = readRootFile(path);
    for (const [index, payload] of jsonBlocks(body).entries()) {
      const method = payload.method;
      assert.ok(method === "tools/list" || method === "tools/call", `${path} payload ${index + 1} invalid method`);
      if (method === "tools/list") {
        assert.ok(!payload.params || Object.keys(payload.params).length === 0, `${path} tools/list params must be empty`);
        continue;
      }
      const name = payload.params?.name;
      assert.equal(typeof name, "string", `${path} payload ${index + 1} params.name must be a string`);
      const schema = v01ToolSchemas.get(name);
      assert.ok(schema, `${path} payload ${index + 1} uses non-v0.1 tool ${name}`);
      const args = payload.params?.arguments ?? {};
      for (const field of schema.required) {
        assert.equal(typeof args[field], "string", `${path} ${name}.${field} must be string`);
        assert.notEqual(args[field].trim(), "", `${path} ${name}.${field} must be non-empty`);
      }
      const allowed = new Set([...schema.required, ...schema.optional]);
      for (const field of Object.keys(args)) {
        assert.ok(allowed.has(field), `${path} ${name} has unexpected argument ${field}`);
      }
    }
  }
});

function readRootFile(path) {
  const body = readFileSync(join(root, path), "utf8");
  assert.notEqual(body.trim(), "", `${path} is empty`);
  return body;
}

function assertTemplateTerms(path, terms) {
  const body = readRootFile(path);
  for (const term of terms) {
    assert.match(body, escapeRegExp(term), `${path} missing ${term}`);
  }
}

function assertNoDirectPublishTools(body) {
  for (const forbidden of ["publish_schema", "publish_version", "publish_api_version", "publish_doc_version", "approve_draft"]) {
    assert.doesNotMatch(body, new RegExp(`\\b${forbidden}\\b`), `direct publish tool must stay absent: ${forbidden}`);
  }
}

function assertNoRemovedTerms(body) {
  for (const forbidden of ["list_services", "service_id", "compare_versions", "get_service_latest_schema"]) {
    assert.doesNotMatch(body, new RegExp(`\\b${forbidden}\\b`), `removed service-era term must stay absent: ${forbidden}`);
  }
}

function assertNoSecrets(body) {
  assert.doesNotMatch(body, /vdoc_[A-Za-z0-9._~+/=-]{8,}/);
  assert.doesNotMatch(body, /Authorization\s*:/i);
}

function jsonBlocks(body) {
  const blocks = [];
  const pattern = /```json\s*([\s\S]*?)```/g;
  for (const match of body.matchAll(pattern)) {
    blocks.push(JSON.parse(match[1]));
  }
  return blocks;
}

function escapeRegExp(value) {
  return new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
}
