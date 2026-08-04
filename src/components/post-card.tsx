import Link from "next/link";
import type { PostSummary } from "@/lib/posts";
import { formatDateShort } from "@/utils/formatDate";

type PostCardProps = {
  post: PostSummary;
  featured?: boolean;
};

export function PostCard({ post, featured = false }: PostCardProps) {
  const { slug, data } = post;

  return (
    <article
      className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/55 transition duration-300 hover:-translate-y-1 hover:border-emerald-300/35 hover:bg-slate-900/80 ${
        featured ? "min-h-80" : "min-h-64"
      }`}
    >
      <Link href={`/blog/${slug}`} className="flex h-full flex-col p-6 sm:p-7">
        <div className="mb-8 flex items-center justify-between gap-4 text-xs">
          <span className="rounded-full border border-emerald-300/20 bg-emerald-300/8 px-3 py-1 font-medium text-emerald-300">
            {data.category}
          </span>
          <time dateTime={data.date} className="font-mono text-slate-500">
            {formatDateShort(data.date)}
          </time>
        </div>

        <div className="mt-auto">
          {featured && (
            <p className="mb-3 font-mono text-xs tracking-[0.16em] text-cyan-300/80">
              FEATURED NOTE
            </p>
          )}
          <h2 className={`${featured ? "text-3xl sm:text-4xl" : "text-2xl"} font-bold leading-tight text-white transition group-hover:text-emerald-200`}>
            {data.title}
          </h2>
          <p className="mt-4 line-clamp-3 leading-7 text-slate-400">{data.excerpt}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {data.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-xs text-slate-500">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </Link>
    </article>
  );
}
