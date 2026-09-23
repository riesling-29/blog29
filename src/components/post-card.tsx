import Link from "next/link";
import type { PostSummary } from "@/lib/posts";
import { formatDateShort } from "@/utils/formatDate";

type PostCardProps = { post: PostSummary; featured?: boolean; };
export function PostCard({ post, featured = false }: PostCardProps) {
  const { slug, data } = post;
  return (
    <article className={`post-card group ${featured ? "featured" : ""}`}>
      <Link href={`/blog/${slug}`}>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <span className="category-label">{data.category}</span>
          <time dateTime={data.date} className="font-mono text-xs text-muted">{formatDateShort(data.date)}</time>
        </div>
        <div className="max-w-3xl">
          {featured && <p className="eyebrow mb-4">SELECTED ENTRY</p>}
          <h2 className={`${featured ? "text-3xl sm:text-4xl" : "text-2xl"} leading-snug text-ink group-hover:text-accent`}>{data.title}</h2>
          <p className="mt-4 line-clamp-3 leading-7 text-muted">{data.excerpt}</p>
        </div>
        <div className="mt-7 flex items-end justify-between gap-4">
          <div className="flex flex-wrap gap-3">{data.tags.slice(0, 3).map(tag => <span key={tag} className="text-xs text-muted">#{tag}</span>)}</div>
          <span className="text-xl text-accent" aria-hidden="true">↗</span>
        </div>
      </Link>
    </article>
  );
}
