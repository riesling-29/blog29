import type { Metadata } from "next";
import Link from "next/link";
import { getAllPostsMetadata, getPostContent } from "@/lib/posts";
import { formatDate } from "@/utils/formatDate";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllPostsMetadata().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getAllPostsMetadata().find((item) => item.slug === slug);

  if (!post) {
    return { title: "글을 찾을 수 없음" };
  }

  return {
    title: post.data.title,
    description: post.data.excerpt,
    openGraph: {
      type: "article",
      url: `/blog/${slug}`,
      title: post.data.title,
      description: post.data.excerpt,
      publishedTime: post.data.date,
      modifiedTime: post.data.updated,
      tags: post.data.tags,
      images: ["/og.png"],
    },
  };
}

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params;
  const { data, content } = await getPostContent(slug);

  return (
    <main className="mx-auto max-w-4xl px-5 py-12 sm:px-8 sm:py-20">
      <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-emerald-300">
        <span aria-hidden>←</span> 모든 글
      </Link>

      <article className="mt-10">
        <header className="border-b border-white/10 pb-10">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="rounded-full border border-emerald-300/20 bg-emerald-300/8 px-3 py-1 text-emerald-300">
              {data.category}
            </span>
            <time dateTime={data.date} className="text-slate-500">
              {formatDate(data.date)}
            </time>
            {data.updated && <span className="text-slate-600">수정 {formatDate(data.updated)}</span>}
          </div>
          <h1 className="mt-7 text-4xl font-bold leading-tight tracking-[-0.035em] text-white sm:text-6xl">
            {data.title}
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-400">{data.excerpt}</p>
          <div className="mt-7 flex flex-wrap gap-2">
            {data.tags.map((tag) => (
              <span key={tag} className="font-mono text-xs text-slate-500">
                #{tag}
              </span>
            ))}
          </div>
        </header>

        <div className="prose-blog">{content}</div>

        <footer className="mt-16 flex flex-col gap-4 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">이 글의 내용은 저장소의 MDX 원문과 함께 버전 관리됩니다.</p>
          <Link href="/blog" className="text-sm font-semibold text-emerald-300 transition hover:text-emerald-200">
            다음 기록 찾기 →
          </Link>
        </footer>
      </article>
    </main>
  );
}
