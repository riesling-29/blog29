import type { Heading as MarkdownHeading, Root, RootContent } from "mdast";
import type { Plugin } from "unified";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkMdx from "remark-mdx";
import remarkGfm from "remark-gfm";
import { toString } from "mdast-util-to-string";

export type Heading = { id: string; text: string; level: number };

/** Keep readable Korean anchors; the per-document allocator handles collisions. */
export function slugHeading(text: string): string {
  return (
    text
      .normalize("NFKC")
      .toLocaleLowerCase("ko")
      .replace(/[^\p{L}\p{N}\p{M}\s_-]/gu, "")
      .trim()
      .replace(/\s+/g, "-") || "section"
  );
}

function annotateHeadings(tree: Root): Heading[] {
  const headings: Heading[] = [];
  const used = new Set<string>();
  function walk(node: Root | RootContent) {
    if (node.type === "heading") {
      const heading = node as MarkdownHeading;
      const text = toString(heading).trim();
      const base = slugHeading(text);
      let id = base;
      let suffix = 2;
      while (used.has(id)) id = `${base}-${suffix++}`;
      used.add(id);
      heading.data = {
        ...heading.data,
        hProperties: { ...heading.data?.hProperties, id },
      };
      headings.push({ id, text, level: heading.depth });
    }
    if ("children" in node) {
      for (const child of node.children) walk(child as RootContent);
    }
  }
  walk(tree);
  return headings;
}

/** Use the same Markdown/MDX grammar as the renderer, never line-based matching. */
export function getHeadings(mdxSource: string): Heading[] {
  const tree = unified()
    .use(remarkParse)
    .use(remarkMdx)
    .use(remarkGfm)
    .parse(mdxSource);
  return annotateHeadings(tree);
}

/** Pass directly to compileMDX's remarkPlugins, after remarkGfm. */
export const remarkHeadingIds: Plugin<[], Root> = function remarkHeadingIds() {
  return (tree) => {
    annotateHeadings(tree);
  };
};
