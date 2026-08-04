import Link from "next/link";
import { PostCard } from "@/components/post-card";
import { getAllPostsMetadata } from "@/lib/posts";

export default function Home() {
  const posts = getAllPostsMetadata();
  const featured = posts.find((post) => post.data.featured) ?? posts[0];
  const recentPosts = posts.filter((post) => post.slug !== featured?.slug).slice(0, 4);

  return (
    <main>
      <section className="mx-auto max-w-6xl px-5 pb-16 pt-20 sm:px-8 sm:pb-24 sm:pt-28">
        <p className="font-mono text-xs tracking-[0.24em] text-emerald-300">FIELD NOTES · ARCHIVE 29</p>
        <div className="mt-7 grid gap-10 lg:grid-cols-[1.35fr_0.65fr] lg:items-end">
          <div>
            <h1 className="max-w-4xl text-5xl font-bold leading-[1.08] tracking-[-0.04em] text-white sm:text-7xl">
              생각을 흘려보내지 않고,
              <span className="block text-slate-500">근거와 함께 남깁니다.</span>
            </h1>
          </div>
          <div className="border-l border-emerald-300/25 pl-5">
            <p className="leading-7 text-slate-400">
              기술, 연구, 문화와 일상의 관찰을 한곳에 축적하는 개인 기록 저장소입니다.
              글은 MDX 파일로 관리되고 Vercel에서 정적 페이지로 배포됩니다.
            </p>
            <Link
              href="/blog"
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-emerald-300 transition hover:text-emerald-200"
            >
              전체 기록 보기 <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </section>

      {featured && (
        <section className="mx-auto max-w-6xl px-5 pb-20 sm:px-8">
          <PostCard post={featured} featured />
        </section>
      )}

      <section className="border-y border-white/8 bg-slate-950/35">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
          <div className="mb-9 flex items-end justify-between gap-6">
            <div>
              <p className="font-mono text-xs tracking-[0.2em] text-slate-500">RECENT ENTRIES</p>
              <h2 className="mt-3 text-3xl font-bold text-white">최근 기록</h2>
            </div>
            <Link href="/blog" className="text-sm text-slate-400 transition hover:text-emerald-300">
              모든 글 보기
            </Link>
          </div>

          {recentPosts.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2">
              {recentPosts.map((post) => (
                <PostCard key={post.slug} post={post} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/15 p-10 text-center text-slate-500">
              다음 기록을 준비하고 있습니다.
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-5 py-16 sm:px-8 sm:py-20 md:grid-cols-3">
        {[
          ["01", "파일로 작성", "src/content/posts에 MDX 파일 하나를 추가합니다."],
          ["02", "미리보기", "별도 브랜치에 올리면 Vercel이 Preview 주소를 만듭니다."],
          ["03", "운영 반영", "검토 후 main에 반영하면 Production 배포가 시작됩니다."],
        ].map(([number, title, description]) => (
          <div key={number} className="border-t border-white/10 pt-5">
            <span className="font-mono text-xs text-emerald-300">{number}</span>
            <h3 className="mt-4 text-lg font-semibold text-white">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
