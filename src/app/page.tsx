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
    <TopicCorridor />
    <header className="page-intro"><p className="eyebrow">BLOG29 / RIESLING ITALICO</p><h1>하나의 질문에서,<br />다음 생각으로.</h1><p>기술과 연구에서 만난 질문을 기록합니다.<br />주제를 따라 글과 세미나를 함께 살펴보세요.</p></header>
    <section aria-labelledby="explore-title"><div className="section-heading"><h2 id="explore-title">어떤 주제가 궁금한가요?</h2><Link className="text-link" href="/archive">전체 자료 검색 →</Link></div><TopicCards /></section>
    <section className="home-recent" aria-labelledby="recent-title"><div className="section-heading"><h2 id="recent-title">최근 기록</h2><span className="eyebrow">글과 세미나</span></div>{resources.slice(0, 5).map(r => <ResourceCard key={r.id} resource={r} compact />)}</section>
  </main>;
}
