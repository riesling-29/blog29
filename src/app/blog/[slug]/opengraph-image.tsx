import { ImageResponse } from "next/og";
import { getAllPostsMetadata } from "@/lib/posts";
import { getResource, getTopic } from "@/lib/catalog";

export const alt = "Blog29 글";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return getAllPostsMetadata({ includeDrafts: false }).map((post) => ({
    slug: post.slug,
  }));
}

export default async function OgImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getAllPostsMetadata({ includeDrafts: false }).find(
    (item) => item.slug === slug,
  );
  const resource = getResource(slug);
  const topic = resource ? getTopic(resource.primaryTopic) : undefined;

  const title = post?.data.title ?? "Blog29";
  const topicLabel = topic?.label ?? post?.data.category ?? "";
  const date = post?.data.date ?? "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "#f4efe5",
          color: "#2d3028",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              fontSize: 28,
              letterSpacing: "0.08em",
              color: "#4f5b3a",
              fontWeight: 700,
            }}
          >
            Blog29
          </div>
          {topicLabel ? (
            <div style={{ fontSize: 26, color: "#676b5e" }}>{topicLabel}</div>
          ) : null}
        </div>
        <div
          style={{
            fontSize: 56,
            lineHeight: 1.35,
            fontWeight: 650,
            letterSpacing: "-0.03em",
            maxWidth: 980,
          }}
        >
          {title}
        </div>
        {date ? (
          <div style={{ fontSize: 24, color: "#676b5e" }}>{date}</div>
        ) : null}
      </div>
    ),
    { ...size },
  );
}
