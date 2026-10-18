import type { Relation, Resource, Topic } from "./catalog";

export type MapArticle = Pick<Resource, "id" | "title" | "href" | "format" | "description"> & {
  label: string;
  topicId: string;
  groupLabel: string;
};
export type MapDomain = {
  id: string;
  label: string;
  shortLabel: string;
  href: string;
  groups: { label: string; fullLabel: string; href: string; articles: MapArticle[] }[];
};
export type KnowledgeMapData = { domains: MapDomain[]; relations: Relation[] };
export type MapConnection = { id: string; label: string; reason: string; incoming: boolean };

const articleLabels: Record<string, string> = {
  "ai-agent-harness": "하네스",
  "ai-agent-harness-seminar": "하네스 발표",
  "agent-harness-build-or-reuse-2026": "구현 선택",
  jev: "JEV",
  "persistent-work-agents": "지속형",
  "persistent-work-agents-seminar": "지속형 발표",
  "agent-army-pr-1000": "다중 에이전트",
  "ocel-2-overview": "OCEL 2.0",
  "ai-subscription-api-local-llm-cost-2026": "구독·API·로컬",
  "saif-2026": "SAIF 2026",
  "saif-2026-seminar": "SAIF 발표",
  welcome: "운영 안내",
  "first-post": "첫 기록",
};
const groupLabels: Record<string, string[]> = {
  "ai-agents": ["개념·구조", "구현·선택", "지속·운영"],
  "process-intelligence": ["이벤트 로그"],
  "ai-practice": ["사용 방식", "업무 적용"],
  operations: ["운영 노트"],
};

/** Each public resource has one stable address, independent of the selected node. */
export function buildKnowledgeMap(topics: Topic[], resources: Resource[], relations: Relation[]): KnowledgeMapData {
  const publicIds = new Set(resources.map(r => r.id));
  const domains = topics.map(topic => {
    const assigned = new Set<string>();
    const article = (r: Resource, groupLabel: string): MapArticle => ({
      id: r.id, title: r.title, href: r.href, format: r.format,
      description: r.description, label: articleLabels[r.id] ?? r.title,
      topicId: topic.id, groupLabel,
    });
    const groups = topic.questions.map((q, index) => {
      const label = groupLabels[topic.id]?.[index] ?? q.label;
      const articles = q.resourceIds.flatMap(id => {
        const resource = resources.find(r => r.id === id && r.primaryTopic === topic.id);
        if (!resource || assigned.has(id)) return [];
        assigned.add(id);
        return [article(resource, label)];
      });
      return { label, fullLabel: q.label, href: `/topics/${topic.id}#question-${index}`, articles };
    }).filter(g => g.articles.length);
    const remaining = resources.filter(r => r.primaryTopic === topic.id && !assigned.has(r.id));
    if (remaining.length) groups.push({ label: "기타 기록", fullLabel: "기타 기록", href: `/topics/${topic.id}`, articles: remaining.map(r => article(r, "기타 기록")) });
    return { id: topic.id, label: topic.label, shortLabel: topic.id === "process-intelligence" ? "PI" : topic.id === "operations" ? "운영" : topic.label, href: `/topics/${topic.id}`, groups };
  }).filter(d => d.groups.length);
  return { domains, relations: relations.filter(r => publicIds.has(r.sourceId) && publicIds.has(r.targetId)) };
}

/** Prefer the selected article's explanation when both directions are registered. */
export function mapConnections(data: KnowledgeMapData, selectedId?: string): MapConnection[] {
  if (!selectedId) return [];
  const labels = { background: "배경 이해", deeper: "더 깊게", compare: "비교하기", companion: "함께 보기" };
  const incomingLabels = { background: "이후 응용", deeper: "먼저 읽기", compare: "비교하기", companion: "함께 보기" };
  const result = new Map<string, MapConnection>();
  for (const r of data.relations.filter(r => r.sourceId === selectedId)) {
    if (!result.has(r.targetId)) result.set(r.targetId, { id: r.targetId, label: labels[r.type], reason: r.reason, incoming: false });
  }
  for (const r of data.relations.filter(r => r.targetId === selectedId)) {
    if (!result.has(r.sourceId)) result.set(r.sourceId, { id: r.sourceId, label: incomingLabels[r.type], reason: r.reason, incoming: true });
  }
  return [...result.values()];
}
