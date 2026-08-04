import type { Metadata } from "next";
import { getAllPostsMetadata, getPostContent } from "@/lib/posts";
import { formatDate } from "@/utils/formatDate";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  const posts = getAllPostsMetadata();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getAllPostsMetadata().find((p) => p.slug === slug);
  return {
    title: post?.data.title ?? "Post",
    description: post?.data.excerpt ?? "",
  };
}

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params;
  const { data, content } = await getPostContent(slug);

  return (
    <article className="max-w-3xl mx-auto px-4 py-12">
      <header className="mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight">{data.title}</h1>
        <div className="mt-4 text-sm text-zinc-500">
          <span>{formatDate(data.date)}</span>
        </div>
        <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">{data.excerpt}</p>
      </header>
      <div>
        {content}
      </div>
    </article>
  );
}
