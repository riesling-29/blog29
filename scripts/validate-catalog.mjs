/** Local editorial validation. Node 22.15+ / 24; no application dependency added. */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import { dirname, extname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(root);
registerHooks({
  resolve(specifier, context, nextResolve) {
    let candidate;
    if (specifier.startsWith("@/"))
      candidate = resolve(root, "src", specifier.slice(2));
    else if (
      specifier.startsWith(".") &&
      context.parentURL?.startsWith("file:") &&
      !context.parentURL.includes("/node_modules/")
    )
      candidate = resolve(dirname(fileURLToPath(context.parentURL)), specifier);
    if (candidate && !extname(candidate)) {
      for (const suffix of [".ts", ".tsx", ".js", "/index.ts"]) {
        if (existsSync(candidate + suffix))
          return nextResolve(pathToFileURL(candidate + suffix).href, context);
      }
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (/\.(?:ts|tsx)$/.test(url) && !url.includes("/node_modules/")) {
      const file = fileURLToPath(url);
      const result = ts.transpileModule(readFileSync(file, "utf8"), {
        fileName: file,
        compilerOptions: {
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ES2020,
          jsx: ts.JsxEmit.ReactJSX,
        },
      });
      return {
        format: "module",
        source: result.outputText,
        shortCircuit: true,
      };
    }
    return nextLoad(url, context);
  },
});

const { getResources, getRelationsFrom, validateCatalog, topics, operationsTopic } = await import(
  "../src/lib/catalog.ts"
);
const { getHeadings, remarkHeadingIds } = await import(
  "../src/lib/headings.ts"
);
const { getAllPostsMetadata } = await import("../src/lib/posts.ts");
const { unified } = await import("unified");
const { default: remarkParse } = await import("remark-parse");
const { default: remarkMdx } = await import("remark-mdx");
const { default: sitemap } = await import("../src/app/sitemap.ts");

const errors = validateCatalog();
assert.deepEqual(errors, [], errors.join("\n"));
const resources = getResources();
const { buildKnowledgeMap, mapConnections } = await import("../src/lib/knowledge-map.ts");
const mapData = buildKnowledgeMap([...topics, operationsTopic], resources, resources.flatMap(r => getRelationsFrom(r.id)));
const mapArticles = mapData.domains.flatMap(d => d.groups.flatMap(g => g.articles));
assert.deepEqual(mapArticles.map(a => a.id).sort(), resources.map(r => r.id).sort(), "Every public resource has exactly one map address, including cross-topic resources.");
for (const article of mapArticles) {
  assert.equal(article.topicId, resources.find(r => r.id === article.id).primaryTopic);
}
const fixedLayout = JSON.stringify(mapData.domains);
for (const resource of resources) {
  const connections = mapConnections(mapData, resource.id);
  assert.equal(new Set(connections.map(c => c.id)).size, connections.length, "Reciprocal links appear once.");
  assert(!connections.some(c => c.id === resource.id), "No self relations.");
  for (const connection of connections) assert(mapArticles.some(a => a.id === connection.id), "Highlighted target must have a visible map address.");
  assert.equal(JSON.stringify(mapData.domains), fixedLayout, "Changing the selected article must never move map nodes.");
}
const harnessConnections = mapConnections(mapData, "ai-agent-harness");
assert.equal(harnessConnections.find(c => c.id === "saif-2026")?.incoming, true, "Cross-topic incoming references are discoverable.");
assert.equal(mapConnections(mapData, "agent-harness-build-or-reuse-2026").find(c => c.id === "ai-agent-harness")?.incoming, false, "Use the selected article's explanation when both directions exist.");
const mapWithExtra = buildKnowledgeMap([...topics, operationsTopic], [...resources, { ...resources[0], id: "future-note", href: "/blog/future-note", primaryTopic: "ai-agents", topics: ["ai-agents"] }], []);
assert(mapWithExtra.domains.find(d => d.id === "ai-agents").groups.some(g => g.articles.some(a => a.id === "future-note")), "New public resources without a question assignment must not disappear.");
const publicPosts = getAllPostsMetadata({ includeDrafts: false });
assert.deepEqual(
  resources
    .filter((resource) => resource.format === "article")
    .map((resource) => resource.id)
    .sort(),
  publicPosts.map((post) => post.slug).sort(),
  "Every public article appears once, regardless of development mode.",
);
const drafts = getAllPostsMetadata({ includeDrafts: true }).filter(
  (post) => post.data.draft,
);
for (const draft of drafts) {
  assert(
    !resources.some((resource) => resource.id === draft.slug),
    `Draft leaked: ${draft.slug}`,
  );
  assert(
    !sitemap().some((entry) => entry.url.endsWith(`/blog/${draft.slug}`)),
    `Draft in sitemap: ${draft.slug}`,
  );
}
assert(
  !resources.some((resource) => resource.id.startsWith("_")),
  "Templates must not appear in the catalog.",
);
assert.equal(
  new Set(sitemap().map((entry) => entry.url)).size,
  sitemap().length,
  "Sitemap URLs must be unique.",
);

const fixture = [
  "## 한글 **제목**과 `code`",
  "",
  "```md",
  "## 코드 안의 가짜 제목",
  "```",
  "",
  "## 한글 **제목**과 `code`",
  "",
  "## 한글 제목과 code-2",
  "",
  "세트엑스 제목",
  "-------------",
  "",
  "### [링크](https://example.com) & 설명",
  "",
  "<div>## JSX 안의 가짜 제목</div>",
].join("\n");
const headings = getHeadings(fixture);
assert.deepEqual(
  headings.map(({ id }) => id),
  [
    "한글-제목과-code",
    "한글-제목과-code-2",
    "한글-제목과-code-2-2",
    "세트엑스-제목",
    "링크-설명",
  ],
);
assert.equal(headings[4].level, 3);
const processor = unified()
  .use(remarkParse)
  .use(remarkMdx)
  .use(remarkHeadingIds);
const renderedTree = processor.runSync(processor.parse(fixture));
const renderedIds = [];
function walk(node) {
  if (node.type === "heading") renderedIds.push(node.data?.hProperties?.id);
  for (const child of node.children ?? []) walk(child);
}
walk(renderedTree);
assert.deepEqual(
  renderedIds,
  headings.map((heading) => heading.id),
  "TOC and rendered heading anchors must match.",
);
const relationCount = resources.reduce(
  (count, resource) => count + getRelationsFrom(resource.id).length,
  0,
);
console.log(
  `Catalog valid: ${publicPosts.length} public articles, ${resources.filter((resource) => resource.format === "seminar").length} seminars, ${relationCount} relations, ${sitemap().length} sitemap URLs.`,
);
console.log(
  "Heading checks passed: Korean, inline formatting, duplicate collisions, Setext, fenced code, MDX, renderer/TOC consistency.",
);
