import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import matter from "gray-matter";
import { compileMDX } from "next-mdx-remote/rsc";

export type PostData = {
  title: string;
  date: string;
  excerpt: string;
};

const postsDirectory = join(process.cwd(), "src/content/posts");

export function getPostSlugs(): string[] {
  const fileNames = readdirSync(postsDirectory);
  return fileNames
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => f.replace(/\.mdx$/, ""));
}

export function getAllPostsMetadata() {
  const fileNames = readdirSync(postsDirectory).filter((f) => f.endsWith(".mdx"));
  return fileNames
    .map((f) => {
      const slug = f.replace(/\.mdx$/, "");
      const fileContents = readFileSync(join(postsDirectory, f), "utf8");
      const { data } = matter(fileContents);
      return { slug, data: data as PostData };
    })
    .sort((a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime());
}

export async function getPostContent(slug: string) {
  const postPath = join(postsDirectory, `${slug}.mdx`);
  const fileContents = readFileSync(postPath, "utf8");
  const { data, content } = matter(fileContents);
  const result = await compileMDX({ source: content }) as any;
  return { data: data as PostData, Content: result.Content };
}
