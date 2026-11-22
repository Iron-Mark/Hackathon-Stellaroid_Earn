import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workflow = readFileSync(new URL('../workflows/mcp-registry-publish.yml', import.meta.url), 'utf8');
assert.match(workflow, /MCP_PUBLISHER_VERSION: v1\.8\.12/);
assert.match(workflow, /MCP_PUBLISHER_SHA256: [a-f0-9]{64}/);
assert.doesNotMatch(workflow, /releases\/latest/);
assert.match(workflow, /set -euo pipefail/);
assert.match(workflow, /sha256sum --check --strict -/);
assert.ok(workflow.indexOf('sha256sum --check') < workflow.indexOf('tar --extract'));
assert.ok(workflow.indexOf('tar --extract') < workflow.indexOf('run: ./mcp-publisher validate'));
assert.match(workflow, /id-token: write/);
assert.match(workflow, /contents: read/);
console.log('Publisher release integrity static checks passed');
