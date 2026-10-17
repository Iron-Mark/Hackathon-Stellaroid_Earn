import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { ESLint } from "eslint";

const require = createRequire(import.meta.url);
const pluginRequire = createRequire(require.resolve("@next/eslint-plugin-next"));
const { getRootDirs } = pluginRequire("./utils/get-root-dirs.js");
const { globSync } = pluginRequire("fast-glob");
const fixture = mkdtempSync(path.join(tmpdir(), "stellaroid-lint-glob-"));
const originalCwd = process.cwd();

for (const directory of ["apps/web/src/app", "apps/admin/pages", "apps/web/docs"]) {
  mkdirSync(path.join(fixture, directory), { recursive: true });
}
writeFileSync(path.join(fixture, "apps/web/src/app/page.tsx"), "export default function Page() { return null; }\n");
writeFileSync(path.join(fixture, "apps/admin/pages/index.js"), "export default function Page() { return null; }\n");
process.chdir(fixture);
after(() => {
  process.chdir(originalCwd);
  // This is the exact temporary fixture returned by mkdtempSync above.
  rmSync(fixture, { recursive: true, force: true });
});

function roots(rootDir) {
  return getRootDirs({ cwd: fixture, settings: { next: { rootDir } } }).sort();
}

test("the pinned Next plugin resolves the reviewed adapter", () => {
  assert.equal(pluginRequire("fast-glob/package.json").name, "@stellaroid/next-lint-glob");
});

test("default and literal roots do not expand into descendants", () => {
  assert.deepEqual(roots(undefined), [fixture]);
  assert.deepEqual(roots("."), ["."]);
  assert.deepEqual(roots("apps/web"), ["apps/web"]);
  assert.deepEqual(roots("apps/web/"), ["apps/web"]);
  assert.deepEqual(roots("apps/missing"), []);
});

test("wildcard, brace, array and Windows root settings find the intended directories", () => {
  const expected = ["apps/admin", "apps/web"];
  assert.deepEqual(roots("apps/*"), expected);
  assert.deepEqual(roots("apps/{web,admin}"), expected);
  assert.deepEqual(roots(["apps/web", null, "apps/admin"]), expected);
  assert.deepEqual(roots("apps\\web"), ["apps/web"]);
});

test("absolute directory roots remain absolute", () => {
  const expected = path.join(fixture, "apps/web").replaceAll("\\", "/");
  assert.deepEqual(roots(expected), [expected]);
});

test("recursive roots exclude the base directory as the Next plugin expects", () => {
  assert.deepEqual(roots("apps/web/**"), ["apps/web/docs", "apps/web/src", "apps/web/src/app"]);
  assert.deepEqual(roots("apps/web/**/"), roots("apps/web/**"));
  assert.deepEqual(roots("apps/{web,admin}/**"), ["apps/admin/pages", "apps/web/docs", "apps/web/src", "apps/web/src/app"]);
});

test("unsupported calls and pathological patterns fail before glob evaluation", () => {
  assert.throws(() => globSync("apps/*", {}), TypeError);
  assert.throws(() => globSync("apps/*", { onlyDirectories: true, deep: 2 }), TypeError);
  assert.throws(() => roots("a".repeat(4097)), /too long/);
  assert.throws(() => roots("{".repeat(65) + "a,b" + "}".repeat(65)), /too deeply nested/);
  assert.throws(() => roots("apps/*/../web"), /Parent traversal/);
  for (const pattern of ["apps/*/**", "apps/**/**", "apps/**/*/**"]) {
    assert.throws(() => roots(pattern), /Dynamic bases/);
  }
});

test("the actual Next link rule still flags internal anchors and accepts Link", async () => {
  const plugin = require("@next/eslint-plugin-next");
  const eslint = new ESLint({
    cwd: fixture,
    overrideConfigFile: true,
    overrideConfig: [{
      files: ["**/*.jsx"],
      languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
      plugins: { "@next/next": plugin },
      settings: { next: { rootDir: "apps/{web,admin}" } },
      rules: { "@next/next/no-html-link-for-pages": "error" },
    }],
  });
  const [invalid] = await eslint.lintText('export default () => <a href="/">Home</a>;', { filePath: "sample.jsx" });
  assert.ok(invalid.errorCount > 0);
  assert.ok(invalid.messages.every((message) => message.ruleId === "@next/next/no-html-link-for-pages"));
  const [valid] = await eslint.lintText('import Link from "next/link"; export default () => <Link href="/">Home</Link>;', { filePath: "sample.jsx" });
  assert.equal(valid.errorCount, 0);
});
