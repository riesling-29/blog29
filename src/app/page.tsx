import Link from "next/link";
import { PostCard } from "@/components/post-card";
import { getAllPostsMetadata } from "@/lib/posts";

export default function Home() {
  const posts = getAllPostsMetadata();
  const featured = posts.find(post => post.data.featured) ?? posts[0];
  const recentPosts = posts.filter(post => post.slug !== featured?.slug).slice(0, 4);
  return (
    <main>
      <section className="hero mx-auto max-w-6xl px-5 sm:px-8">
        <div className="mb-8 flex items-center justify-between gap-4 border-b border-line pb-4">
          <p className="eyebrow">NOTES & OBSERVATIONS</p>
          <span className="font-mono text-xs text-muted">by riesling29</span>
        </div>
        <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr] lg:items-end">
          <h1 className="hero-title">생각을 기록하고,<br /><span className="text-accent">다시 들여다봅니다.</span></h1>
          <div className="lg:pb-2 lg:pl-8">
            <p className="max-w-md leading-8 text-muted">기술과 연구, 문화와 일상 사이에서 발견한 질문들.<br />지나가는 생각에 근거를 더해 차곡차곡 남깁니다.</p>
            <Link href="/blog" className="mt-6 inline-flex items-center gap-6 border-b border-accent pb-2 text-sm text-accent">기록 둘러보기 <span aria-hidden="true">→</span></Link>
          </div>
        </div>
      </section>
      {featured && <section className="mx-auto max-w-6xl px-5 pb-16 sm:px-8 sm:pb-20" aria-label="선택한 기록"><PostCard post={featured} featured /></section>}
      <section className="mx-auto max-w-6xl px-5 pb-20 sm:px-8 sm:pb-28">
        <div className="mb-8 flex items-end justify-between gap-6">
          <div><p className="eyebrow">THE JOURNAL</p><h2 className="editorial-title mt-3 text-3xl">최근 기록</h2></div>
          <Link href="/blog" className="text-sm text-muted hover:text-accent">모든 글 →</Link>
        </div>
        {recentPosts.length ? <div className="grid gap-x-8 gap-y-4 md:grid-cols-2">{recentPosts.map(post => <PostCard key={post.slug} post={post} />)}</div> : <p className="border-t border-line py-10 text-muted">다음 기록을 준비하고 있습니다.</p>}
      </section>
    </main>
  );
}
