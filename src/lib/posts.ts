import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import matter from "gray-matter";
import remarkGfm from "remark-gfm";
import { compileMDX } from "next-mdx-remote/rsc";
import type { MDXComponents } from "mdx/types";
import type { Root, RootContent } from "mdast";
import type { Plugin } from "unified";
import { getHeadings, remarkHeadingIds } from "./headings";

export type PostData = {
  title: string;
  date: string;
  excerpt: string;
  category: string;
  tags: string[];
  featured: boolean;
  draft: boolean;
  updated?: string;
};

export type PostSummary = {
  slug: string;
  data: PostData;
};

const postsDirectory = join(process.cwd(), "src/content/posts");

function isPostFile(fileName: string) {
  return fileName.endsWith(".mdx") && !fileName.startsWith("_");
}

function requireString(value: unknown, field: string, fileName: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(
      `[${fileName}] frontmatter의 ${field} 값은 비어 있지 않은 문자열이어야 합니다.`,
    );
  }
  return value.trim();
}

function requireDate(value: unknown, field: string, fileName: string) {
  const date = requireString(value, field, fileName);
  const parsed = new Date(`${date}T00:00:00Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== date
  ) {
    throw new Error(
      `[${fileName}] frontmatter의 ${field} 값은 YYYY-MM-DD 형식의 유효한 날짜여야 합니다.`,
    );
  }
  return date;
}

function requireTags(value: unknown, fileName: string) {
  if (
    !Array.isArray(value) ||
    value.length === 0 ||
    value.some((tag) => typeof tag !== "string" || tag.trim().length === 0)
  ) {
    throw new Error(
      `[${fileName}] frontmatter의 tags 값은 하나 이상의 문자열 배열이어야 합니다.`,
    );
  }
  return value.map((tag) => tag.trim());
}

function parsePostData(
  data: Record<string, unknown>,
  fileName: string,
): PostData {
  return {
    title: requireString(data.title, "title", fileName),
    date: requireDate(data.date, "date", fileName),
    excerpt: requireString(data.excerpt, "excerpt", fileName),
    category: requireString(data.category, "category", fileName),
    tags: requireTags(data.tags, fileName),
    featured: data.featured === true,
    draft: data.draft === true,
    updated:
      data.updated === undefined
        ? undefined
        : requireDate(data.updated, "updated", fileName),
  };
}

function readPostSource(fileName: string) {
  const fileContents = readFileSync(join(postsDirectory, fileName), "utf8");
  const parsed = matter(fileContents);
  return {
    data: parsePostData(parsed.data, fileName),
    content: parsed.content,
  };
}

export function getPostSlugs(): string[] {
  const fileNames = readdirSync(postsDirectory);
  return fileNames.filter(isPostFile).map((f) => f.replace(/\.mdx$/, ""));
}

export function getAllPostsMetadata({
  includeDrafts = process.env.NODE_ENV !== "production",
} = {}): PostSummary[] {
  const fileNames = readdirSync(postsDirectory).filter(isPostFile);
  return fileNames
    .map((f) => {
      const slug = f.replace(/\.mdx$/, "");
      const { data } = readPostSource(f);
      return { slug, data };
    })
    .filter((post) => includeDrafts || !post.data.draft)
    .sort((a, b) => b.data.date.localeCompare(a.data.date));
}

/** Add related reading after the complete section, including its subsections. */
function sectionRelationsPlugin(sectionIds: string[]): Plugin<[], Root> {
  return function sectionRelations() {
    return (tree) => {
      const sections = new Set(sectionIds);
      const insertions = new Map<number, string[]>();
      tree.children.forEach((node, index) => {
        if (node.type !== "heading") return;
        const id = node.data?.hProperties?.id;
        if (typeof id !== "string" || !sections.has(id)) return;
        let boundary = index + 1;
        while (boundary < tree.children.length) {
          const candidate = tree.children[boundary];
          if (candidate.type === "heading" && candidate.depth <= node.depth)
            break;
          boundary += 1;
        }
        insertions.set(boundary, [...(insertions.get(boundary) ?? []), id]);
      });
      const children: RootContent[] = [];
      for (let index = 0; index <= tree.children.length; index += 1) {
        for (const section of insertions.get(index) ?? []) {
          children.push({
            type: "mdxJsxFlowElement",
            name: "RelatedSection",
            attributes: [
              { type: "mdxJsxAttribute", name: "section", value: section },
            ],
            children: [],
          } as RootContent);
        }
        if (tree.children[index]) children.push(tree.children[index]);
      }
      tree.children = children;
    };
  };
}

export async function getPostContent(
  slug: string,
  {
    components,
    relationSections = [],
  }: { components?: MDXComponents; relationSections?: string[] } = {},
) {
  if (!getPostSlugs().includes(slug)) {
    throw new Error(`존재하지 않는 글 slug입니다: ${slug}`);
  }

  const fileName = `${slug}.mdx`;
  const { data, content: mdxSource } = readPostSource(fileName);
  const result = await compileMDX({
    source: mdxSource,
    components,
    options: {
      mdxOptions: {
        remarkPlugins: [
          remarkGfm,
          remarkHeadingIds,
          sectionRelationsPlugin(relationSections),
        ],
      },
    },
  });
  return {
    data,
    content: result.content as React.ReactElement,
    headings: getHeadings(mdxSource),
  };
}
