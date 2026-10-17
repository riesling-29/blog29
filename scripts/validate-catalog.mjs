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

const { getResources, getRelationsFrom, validateCatalog } = await import(
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
