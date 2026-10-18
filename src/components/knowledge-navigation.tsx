import Link from "next/link";
import { buildKnowledgeMap } from "@/lib/knowledge-map";
import { KnowledgeMap } from "./knowledge-map";
import { getResources, getRelationsFrom, getTopic, topics, operationsTopic, type Resource, type Topic } from "@/lib/catalog";

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

export function SurroundingMap({ topic, resource }: { topic: Topic; resource?: Resource }) {
  const resources = getResources();
  const data = buildKnowledgeMap([...topics, operationsTopic], resources, resources.flatMap(r => getRelationsFrom(r.id)));
  return <KnowledgeMap key={resource?.id ?? topic.id} data={data} selectedId={resource?.id} topicId={topic.id} />;
}
