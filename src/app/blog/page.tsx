import type { Metadata } from "next";
import { PostCard } from "@/components/post-card";
import { getAllPostsMetadata } from "@/lib/posts";

export const metadata: Metadata = {
  title: "모든 글",
  description: "Blog29에 축적된 기술, 연구, 문화와 일상의 기록",
};

export default function BlogIndex() {
  const posts = getAllPostsMetadata();
  const categoryCounts = posts.reduce<Record<string, number>>((counts, post) => {
    counts[post.data.category] = (counts[post.data.category] ?? 0) + 1;
    return counts;
  }, {});

  return (
    <main className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
      <header className="grid gap-8 border-b border-white/10 pb-12 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="font-mono text-xs tracking-[0.22em] text-emerald-300">ALL ENTRIES</p>
          <h1 className="mt-4 text-5xl font-bold tracking-[-0.04em] text-white sm:text-6xl">모든 글</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-400">
            분야를 제한하지 않고, 나중에 다시 검토할 가치가 있는 생각과 과정을 기록합니다.
          </p>
        </div>
        <p className="font-mono text-sm text-slate-500">{posts.length.toString().padStart(2, "0")} NOTES</p>
      </header>

      {Object.keys(categoryCounts).length > 0 && (
        <section className="flex flex-wrap gap-2 py-8" aria-label="글 분류">
          {Object.entries(categoryCounts).map(([category, count]) => (
            <span key={category} className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-slate-400">
              {category} <span className="ml-1 font-mono text-xs text-slate-600">{count}</span>
            </span>
          ))}
        </section>
      )}

      {posts.length > 0 ? (
        <section className="grid gap-5 md:grid-cols-2">
          {posts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </section>
      ) : (
        <section className="rounded-2xl border border-dashed border-white/15 p-12 text-center">
          <h2 className="text-xl font-semibold text-white">아직 공개된 글이 없습니다.</h2>
          <p className="mt-3 text-slate-500">초안의 draft 값을 false로 바꾸고 다시 배포해 주세요.</p>
        </section>
      )}
    </main>
  );
}
