import Link from "next/link";
import { getResource, getResourcesForTopic, getRelationsFrom, getTopic, topics, relationLabels, type Resource, type Topic } from "@/lib/catalog";

export function questionFor(resource: Resource) {
  const topic = getTopic(resource.primaryTopic);
  const index = topic?.questions.findIndex(q => q.resourceIds.includes(resource.id)) ?? -1;
  return index >= 0 && topic ? { label: topic.questions[index].label, href: `/topics/${topic.id}#question-${index}` } : undefined;
}

export function TopicCorridor({ topic, resource }: { topic?: Topic; resource?: Resource }) {
  return <nav className="topic-corridor" aria-label={topic ? "이 주제의 질문" : "전체 주제"}>
    {topic ? topic.questions.map((q, i) => <Link key={q.label} href={`/topics/${topic.id}#question-${i}`} aria-current={resource && q.resourceIds.includes(resource.id) ? "location" : undefined}><span className="corridor-number">{String(i + 1).padStart(2, "0")}</span>{q.label}</Link>) : topics.map(t => <Link key={t.id} href={`/topics/${t.id}`}>{t.label}</Link>)}
  </nav>;
}

function Node({ href, title, label, className = "" }: { href: string; title: string; label: string; className?: string }) {
  return <Link href={href} className={`map-node ${className}`}><small>{label}</small><span>{title}</span></Link>;
}

export function SurroundingMap({ topic, resource }: { topic: Topic; resource?: Resource }) {
  const resources = getResourcesForTopic(topic.id);
  const relations = resource ? getRelationsFrom(resource.id) : [];
  const related = relations.map(r => ({ relation: r, target: getResource(r.targetId) })).filter(x => x.target);
  const background = related.find(x => x.relation.type === "background");
  const onward = related.find(x => x.relation.type === "deeper" || x.relation.type === "compare");
  const companion = related.find(x => x.relation.type === "companion");
  const peers = resources.filter(r => r.id !== resource?.id && !related.some(x => x.target?.id === r.id));
  const question = resource ? questionFor(resource) : undefined;
  const left = background?.target ?? peers[0];
  const right = onward?.target ?? peers.find(r => r.id !== left?.id);
  return <section className="surrounding-map" aria-label="주변 지도">
    <div className="map-heading"><h2>주변 지도</h2><span>{resource ? "현재 글 기준" : "현재 주제 기준"}</span></div>
    <nav aria-label="주변 주제와 자료" className="map-grid">
      <Node className="map-parent" href={resource ? (question?.href ?? `/topics/${topic.id}`) : "/topics"} title={resource ? (question?.label ?? topic.label) : "전체 주제"} label="↑ 상위" />
      {left && <Node className="map-left" href={left.href} title={left.title} label={background ? "배경 이해" : "같은 주제"} />}
      <div className="map-node map-current" aria-current="true"><small>현재 {resource ? (resource.format === "seminar" ? "세미나" : "글") : "주제"}</small><strong>{resource?.title ?? topic.label}</strong></div>
      {right && <Node className="map-right" href={right.href} title={right.title} label={onward ? relationLabels[onward.relation.type] : "같은 주제"} />}
      {companion?.target ? <Node className="map-child" href={companion.target.href} title={companion.target.title} label="함께 보기" /> : !resource && resources[2] ? <Node className="map-child" href={resources[2].href} title={resources[2].title} label="이 주제의 자료" /> : null}
    </nav>
    <p className="map-caption">노드를 누르면 해당 주제나 자료로 이동합니다.</p>
    <details className="map-expanded"><summary>연결과 자료 전체 보기</summary>
      {related.map(({ relation, target }) => target && <Link key={relation.id} href={target.href} className={target.primaryTopic !== topic.id ? "map-cross-topic" : ""}><small>{relationLabels[relation.type]}{target.primaryTopic !== topic.id ? " · 다른 주제" : ""}</small><strong>{target.title}</strong><span>{relation.reason}</span></Link>)}
      {peers.map(r => <Link key={r.id} href={r.href}><small>같은 주제 · {r.format === "seminar" ? "세미나" : "글"}</small>{r.title}</Link>)}
      {!related.length && !peers.length && <p className="map-caption">아직 연결된 다른 자료가 없습니다.</p>}
    </details>
  </section>;
}
