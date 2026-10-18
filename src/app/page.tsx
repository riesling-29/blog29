import Link from "next/link";
import type { Metadata } from "next";
import { getResources } from "@/lib/catalog";
import { ResourceCard } from "@/components/resource-card";
import { TopicCards } from "@/components/topic-cards";
import { TopicCorridor } from "@/components/knowledge-navigation";
export const metadata: Metadata = { alternates: { canonical: "/" } };
export default function Home() {
  const resources = getResources().filter(r => r.primaryTopic !== "operations");
  return <main className="page-width index-page corridor-home">
    <header className="archive-heading"><h1>글·세미나</h1><span>{resources.length}개 기록</span></header>
    <TopicCorridor />
    <section aria-labelledby="explore-title"><div className="section-heading"><h2 id="explore-title">주제</h2><Link className="text-link" href="/archive">전체 자료 검색 →</Link></div><TopicCards /></section>
    <section className="home-recent" aria-labelledby="recent-title"><div className="section-heading"><h2 id="recent-title">최근 기록</h2><span className="eyebrow">글과 세미나</span></div>{resources.slice(0, 5).map(r => <ResourceCard key={r.id} resource={r} compact />)}</section>
  </main>;
}
