import Link from "next/link";
import { getAllPostsMetadata } from "@/lib/posts";
import { formatDate } from "@/utils/formatDate";

export const metadata = {
  title: "Blog",
  description: "Latest blog posts",
};

export default function BlogIndex() {
  const posts = getAllPostsMetadata();

  if (posts.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">No posts yet</h2>
        <p className="text-zinc-500">Check back soon for new content!</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-24">
      <h2 className="text-3xl font-bold text-white mb-8">Blog Posts</h2>
      <div className="grid gap-6 sm:grid-cols-2">
        {posts.map(({ slug, data }) => (
          <Link
            key={slug}
            href={`/blog/${slug}`}
            className="group rounded-xl border border-zinc-800 bg-[#1e293b]/50 p-6 hover:border-emerald-400/50 hover:bg-[#1e293b] transition-all duration-300"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-white group-hover:text-emerald-400 transition-colors">
                  {data.title}
                </h3>
                <p className="mt-2 text-sm text-zinc-400">{data.excerpt}</p>
              </div>
              <span className="shrink-0 text-xs text-zinc-500 group-hover:text-emerald-400 transition-colors">
                {formatDate(data.date)}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
