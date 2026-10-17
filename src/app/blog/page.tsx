import { Suspense } from "react";
import { ResourceCard } from "@/components/resource-card";
import type { Metadata } from "next";
import { ArchiveExplorer } from "@/components/archive-explorer";
import { getResources, topics } from "@/lib/catalog";
export const metadata: Metadata = {
  title: "모든 글",
  description: "기술과 연구에서 발견한 질문, 판단과 관찰의 기록.",
  alternates: { canonical: "/blog" },
};
export default function BlogIndex() {
  return (
    <main className="page-width index-page archive-page">
      <header className="page-intro">
        <p className="eyebrow">THE JOURNAL</p>
        <h1>생각을 쌓아가는 기록.</h1>
        <p>필요한 주제로 좁히거나, 새로운 질문을 만나보세요.</p>
      </header>
      <Suspense
        fallback={
          <div className="archive-results">
            {getResources()
              .filter((r) => r.format === "article")
              .map((r) => (
                <ResourceCard key={r.id} resource={r} />
              ))}
          </div>
        }
      >
        <ArchiveExplorer
          resources={getResources()}
          topics={topics}
          initialFormat="article"
        />
      </Suspense>
    </main>
  );
}
