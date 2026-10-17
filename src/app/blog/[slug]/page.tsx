import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createElement, type ComponentProps } from "react";
import type { MDXComponents } from "mdx/types";
import { getAllPostsMetadata, getPostContent } from "@/lib/posts";
import { getRelationsFrom, getResource, getTopic } from "@/lib/catalog";
import { ReadingShell, RelatedResources } from "@/components/reading-shell";
import { ContextualLink } from "@/components/contextual-link";
import { formatDate } from "@/utils/formatDate";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllPostsMetadata({ includeDrafts: false }).map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getAllPostsMetadata({ includeDrafts: false }).find(
    (item) => item.slug === slug,
  );
  if (!post)
    return {
      title: "글을 찾을 수 없음",
      robots: { index: false, follow: false },
    };
  return {
    title: post.data.title,
    description: post.data.excerpt,
    alternates: { canonical: `/blog/${slug}` },
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

function headingComponent(tag: "h1" | "h2" | "h3" | "h4" | "h5" | "h6") {
  return function ReadingHeading({
    children,
    id,
    ...props
  }: ComponentProps<"h2">) {
    return createElement(
      tag,
      { ...props, id, tabIndex: -1, "data-reading-heading": true },
      children,
    );
  };
}

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params;
  const resource = getResource(slug);
  if (!resource || resource.format !== "article") notFound();
  const topic = getTopic(resource.primaryTopic);
  const relations = getRelationsFrom(resource.id);
  const components: MDXComponents = {
    a: ContextualLink,
    h1: headingComponent("h1"),
    h2: headingComponent("h2"),
    h3: headingComponent("h3"),
    h4: headingComponent("h4"),
    h5: headingComponent("h5"),
    h6: headingComponent("h6"),
    RelatedSection: ({ section }: { section: string }) => (
      <RelatedResources
        relations={relations.filter(
          (relation) => relation.sourceSection === section,
        )}
      />
    ),
  };
  const { data, content, headings } = await getPostContent(slug, {
    components,
    relationSections: relations.flatMap((relation) =>
      relation.sourceSection ? [relation.sourceSection] : [],
    ),
  });

  return (
    <ReadingShell resource={resource} headings={headings}>
      <article>
        <header className="reading-article-header">
          <div className="reading-article-meta">
            <Link href={`/topics/${resource.primaryTopic}`}>
              {topic?.label}
            </Link>
            <span>{resource.readingPurpose || "글"}</span>
            <span>약 {resource.readingMinutes}분</span>
          </div>
          <h1 id="reading-title" tabIndex={-1}>
            {data.title}
          </h1>
          <p className="reading-deck">{data.excerpt}</p>
          <div className="reading-article-dates">
            <time dateTime={data.date}>{formatDate(data.date)}</time>
            {data.updated && data.updated !== data.date && (
              <span>
                수정{" "}
                <time dateTime={data.updated}>{formatDate(data.updated)}</time>
              </span>
            )}
          </div>
          <div className="reading-tags" aria-label="태그">
            {data.tags.map((tag) => (
              <Link key={tag} href={`/archive?q=${encodeURIComponent(tag)}`}>
                {tag}
              </Link>
            ))}
          </div>
        </header>

        <div className="prose-blog reading-prose">{content}</div>

        <footer className="reading-article-footer">
          <RelatedResources
            relations={relations.filter((relation) => !relation.sourceSection)}
            label="같은 주제로 함께 보기"
          />
          <div className="reading-footer-links">
            <Link href={`/topics/${resource.primaryTopic}`}>
              {topic?.label} 자료로 돌아가기 ←
            </Link>
            <Link href="/archive">전체 자료 탐색 →</Link>
          </div>
        </footer>
      </article>
    </ReadingShell>
  );
}
