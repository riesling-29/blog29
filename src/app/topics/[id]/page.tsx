import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  topics,
  getTopic,
  getResource,
  getResourcesByTopic,
} from "@/lib/catalog";
import { ResourceCard } from "@/components/resource-card";
type Props = { params: Promise<{ id: string }> };
export function generateStaticParams() {
  return [...topics.map((t) => ({ id: t.id })), { id: "operations" }];
}
export const dynamicParams = false;
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const t = getTopic(id);
  return {
    title: t?.label ?? "주제",
    description: t?.description,
    alternates: { canonical: `/topics/${id}` },
  };
}
export default async function TopicPage({ params }: Props) {
  const { id } = await params;
  const topic = getTopic(id);
  if (!topic) notFound();
  const resources = getResourcesByTopic(id);
  return (
    <main className="page-width index-page">
      <nav className="breadcrumbs" aria-label="현재 위치">
        <Link href="/">홈</Link>
        <span aria-hidden="true">/</span>
        <Link href="/topics">주제별 탐색</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{topic.label}</span>
      </nav>
      <header className="page-intro">
        <p className="eyebrow">TOPIC / {resources.length}개 자료</p>
        <h1>{topic.label}</h1>
        <p>{topic.description}</p>
      </header>
      <div className="topic-detail-layout">
        <aside className="topic-directory">
          <p className="eyebrow">주제 둘러보기</p>
          <nav aria-label="다른 주제">
            {topics.map((t) => (
              <Link
                key={t.id}
                href={`/topics/${t.id}`}
                aria-current={t.id === id ? "page" : undefined}
              >
                {t.label}
                <span aria-hidden="true">{t.id === id ? "●" : "→"}</span>
              </Link>
            ))}
          </nav>
          <Link href={`/archive?topic=${id}`} className="text-link">
            이 주제에서 검색 →
          </Link>
        </aside>
        <div className="question-groups">
          {topic.questions.map((q, i) => (
            <section
              className="question-group"
              key={q.label}
              aria-labelledby={`question-${i}`}
            >
              <div className="question-heading">
                <span className="eyebrow">
                  질문 {String(i + 1).padStart(2, "0")}
                </span>
                <h2 id={`question-${i}`}>{q.label}</h2>
                {q.description && <p>{q.description}</p>}
              </div>
              {q.resourceIds.map((rid) => {
                const r = getResource(rid);
                return r ? (
                  <ResourceCard key={rid} resource={r} compact />
                ) : null;
              })}
            </section>
          ))}
          {topic.questions.length === 0 &&
            resources.map((r) => <ResourceCard key={r.id} resource={r} />)}
          <div className="topic-all">
            <Link className="text-link" href={`/archive?topic=${id}`}>
              이 주제의 모든 자료 {resources.length}개 보기 →
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
