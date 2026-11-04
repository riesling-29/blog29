import { Suspense } from "react";
import { ResourceCard } from "@/components/resource-card";
import type { Metadata } from "next";
import { ArchiveExplorer } from "@/components/archive-explorer";
import { getResources, topics } from "@/lib/catalog";
import {
  mergeOpenGraph,
  mergeTwitter,
} from "@/config/site-metadata";

const archiveDescription =
  "Blog29의 글과 세미나를 주제와 형식으로 찾아보세요.";

export const metadata: Metadata = {
  title: "아카이브 · 통합 검색",
  description: archiveDescription,
  alternates: { canonical: "/archive" },
  openGraph: mergeOpenGraph({
    title: "아카이브 · 통합 검색",
    description: archiveDescription,
  }),
  twitter: mergeTwitter({
    title: "아카이브 · 통합 검색",
    description: archiveDescription,
  }),
};
export default function ArchivePage() {
  return (
    <main className="page-width index-page archive-page">
      <header className="page-intro">
        <p className="eyebrow">THE ARCHIVE</p>
        <h1>필요한 생각을 찾는 곳.</h1>
        <p>글과 세미나를 함께 검색하고, 주제와 형식으로 좁혀보세요.</p>
      </header>
      <Suspense
        fallback={
          <div className="archive-results">
            {getResources().map((r) => (
              <ResourceCard key={r.id} resource={r} />
            ))}
          </div>
        }
      >
        <ArchiveExplorer resources={getResources()} topics={topics} />
      </Suspense>
    </main>
  );
}
