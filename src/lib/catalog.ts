import { readFileSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";
import { siteConfig } from "@/config/site";
import { getAllPostsMetadata } from "./posts";
import { getHeadings, slugHeading } from "./headings";

export type Topic = {
  id: string;
  label: string;
  description: string;
  questions: { label: string; description?: string; resourceIds: string[] }[];
};

export type Resource = {
  id: string;
  format: "article" | "seminar";
  title: string;
  description: string;
  href: string;
  primaryTopic: string;
  topics: string[];
  date?: string;
  updated?: string;
  tags: string[];
  readingPurpose?: string;
  readingMinutes?: number;
  slidesUrl?: string;
  companionIds?: string[];
  outline?: string[];
};

export type Relation = {
  id: string;
  sourceId: string;
  targetId: string;
  type: "background" | "deeper" | "compare" | "companion";
  reason: string;
  sourceSection?: string;
  targetSection?: string;
};

export const SITE_URL = siteConfig.url;

export const relationLabels: Record<Relation["type"], string> = {
  background: "배경 이해",
  deeper: "더 깊게",
  compare: "비교하기",
  companion: "함께 보기",
};

/** Subjects are stable. Questions offer different ways into the same documents. */
export const topics: Topic[] = [
  {
    id: "ai-agents",
    label: "AI 에이전트",
    description:
      "모델이 도구를 쓰는 원리부터, 실행 구조의 선택과 믿고 맡길 수 있는 운영까지.",
    questions: [
      {
        label: "어떻게 일을 하는 걸까?",
        description: "에이전트·하네스·도구의 역할을 구분합니다.",
        resourceIds: ["ai-agent-harness", "ai-agent-harness-seminar"],
      },
      {
        label: "직접 만들까, 가져다 쓸까?",
        description: "실행 엔진과 판단 모델을 선택하는 기준을 살펴봅니다.",
        resourceIds: ["agent-harness-build-or-reuse-2026", "jev"],
      },
      {
        label: "계속 일하게 하려면?",
        description: "지속 실행, 승인, 검증과 인계를 함께 봅니다.",
        resourceIds: [
          "persistent-work-agents",
          "persistent-work-agents-seminar",
          "agent-army-pr-1000",
        ],
      },
    ],
  },
  {
    id: "process-intelligence",
    label: "프로세스 인텔리전스",
    description:
      "업무의 흐름을 데이터로 이해하기 위한 이벤트 로그와 객체 중심 분석의 기초.",
    questions: [
      {
        label: "업무의 흐름을 어떻게 기록할까?",
        description: "여러 객체가 얽힌 실제 업무를 이벤트 로그로 표현합니다.",
        resourceIds: ["ocel-2-overview"],
      },
    ],
  },
  {
    id: "ai-practice",
    label: "AI 활용",
    description:
      "구독·API·로컬 실행의 선택부터, AI 능력을 실제 업무의 결과로 연결하는 조건까지.",
    questions: [
      {
        label: "어떤 방식으로 쓰는 게 나을까?",
        description: "가격표와 실제로 맡길 수 있는 일을 함께 비교합니다.",
        resourceIds: ["ai-subscription-api-local-llm-cost-2026"],
      },
      {
        label: "기술을 업무의 결과로 연결하려면?",
        description: "포럼의 발표와 실무 적용의 질문을 연결해 읽습니다.",
        resourceIds: ["saif-2026", "saif-2026-seminar", "agent-army-pr-1000"],
      },
    ],
  },
];

export const operationsTopic: Topic = {
  id: "operations",
  label: "블로그 운영",
  description: "이 공간을 기록하고, 고치고, 공개하는 방식에 관한 노트.",
  questions: [
    {
      label: "이 블로그는 어떻게 운영할까?",
      resourceIds: ["welcome", "first-post"],
    },
  ],
};

type ArticleClassification = Pick<
  Resource,
  "primaryTopic" | "topics" | "readingPurpose" | "companionIds"
>;
const articleClassification: Record<string, ArticleClassification> = {
  "ai-agent-harness": {
    primaryTopic: "ai-agents",
    topics: ["ai-agents"],
    readingPurpose: "입문",
    companionIds: ["ai-agent-harness-seminar"],
  },
  "agent-harness-build-or-reuse-2026": {
    primaryTopic: "ai-agents",
    topics: ["ai-agents"],
    readingPurpose: "비교·판단",
  },
  "persistent-work-agents": {
    primaryTopic: "ai-agents",
    topics: ["ai-agents"],
    readingPurpose: "비교",
    companionIds: ["persistent-work-agents-seminar"],
  },
  "agent-army-pr-1000": {
    primaryTopic: "ai-agents",
    topics: ["ai-agents", "ai-practice"],
    readingPurpose: "사례",
  },
  jev: {
    primaryTopic: "ai-agents",
    topics: ["ai-agents"],
    readingPurpose: "개념·비교",
  },
  "ocel-2-overview": {
    primaryTopic: "process-intelligence",
    topics: ["process-intelligence"],
    readingPurpose: "입문",
  },
  "ai-subscription-api-local-llm-cost-2026": {
    primaryTopic: "ai-practice",
    topics: ["ai-practice"],
    readingPurpose: "비교·판단",
  },
  "saif-2026": {
    primaryTopic: "ai-practice",
    topics: ["ai-practice", "ai-agents"],
    readingPurpose: "깊이 읽기",
    companionIds: ["saif-2026-seminar"],
  },
  welcome: {
    primaryTopic: "operations",
    topics: ["operations"],
    readingPurpose: "운영 노트",
  },
  "first-post": {
    primaryTopic: "operations",
    topics: ["operations"],
    readingPurpose: "운영 노트",
  },
};

// Metadata and outlines are editorial summaries of the public Seminars READMEs.
// Original presentation paths remain unchanged; each resource has one hub URL.
const seminarResources: Resource[] = [
  {
    id: "ai-agent-harness-seminar",
    format: "seminar",
    title: "AI 에이전트와 하네스: 처음부터 설명하기",
    description:
      "LLM·하네스·도구의 역할을 나누고, 계산 오류의 수정과 재검증을 따라가는 35장 발표자료.",
    href: "/seminars/ai-agent-harness-seminar",
    primaryTopic: "ai-agents",
    topics: ["ai-agents"],
    date: "2026-09-27",
    updated: "2026-09-29",
    tags: ["AI 에이전트", "하네스", "도구 호출"],
    readingPurpose: "입문 세미나",
    slidesUrl:
      "https://riesling-29.github.io/Seminars/ai-agent-harness-seminar/",
    companionIds: ["ai-agent-harness"],
    outline: [
      "LLM·하네스·에이전트의 역할",
      "도구 호출, 실패와 재검증",
      "자율성과 권한의 경계",
      "실제 제품과 과제에 적용하기",
    ],
  },
  {
    id: "persistent-work-agents-seminar",
    format: "seminar",
    title: "채팅이 끝나도 일은 계속된다 — 상시 작업 에이전트 비교",
    description:
      "지속되는 컴퓨터, 백그라운드 실행, 사람의 승인이라는 세 축으로 제품을 살펴보는 10장 후속 세미나.",
    href: "/seminars/persistent-work-agents-seminar",
    primaryTopic: "ai-agents",
    topics: ["ai-agents"],
    date: "2026-09-29",
    tags: ["AI 에이전트", "상주형 에이전트", "승인", "실행 환경"],
    readingPurpose: "비교 세미나",
    slidesUrl:
      "https://riesling-29.github.io/Seminars/persistent-work-agents-seminar/",
    companionIds: ["persistent-work-agents"],
    outline: [
      "세션에서 지속되는 작업으로",
      "컴퓨터·백그라운드·승인",
      "제품 비교와 격리 모델",
      "도입 전에 확인할 질문",
    ],
  },
  {
    id: "saif-2026-seminar",
    format: "seminar",
    title: "SAIF 2026 읽기: 세계를 이해하고 일을 수행하는 AI",
    description:
      "공개 영상과 공식 자료를 연결한 30개 섹션의 웹 세미나. 읽기·발표 모드와 원영상 타임스탬프를 제공합니다.",
    href: "/seminars/saif-2026-seminar",
    primaryTopic: "ai-practice",
    topics: ["ai-practice", "ai-agents"],
    date: "2026-10-02",
    tags: ["SAIF 2026", "AI 에이전트", "AX", "피지컬 AI"],
    readingPurpose: "포럼 해설",
    slidesUrl: "https://riesling-29.github.io/Seminars/saif-2026-seminar/",
    companionIds: ["saif-2026"],
    outline: [
      "검증 가능한 에이전트 작업",
      "기업 도입과 업무 재설계",
      "시각 추론·로봇·월드 모델",
      "기억·학습·온디바이스 AI",
      "공개 영상과 근거 확인",
    ],
  },
];

const relationDefinitions: Relation[] = [
  {
    id: "reuse-harness-background",
    sourceId: "agent-harness-build-or-reuse-2026",
    targetId: "ai-agent-harness",
    type: "background",
    reason:
      "모델과 실행 엔진의 역할이 헷갈린다면, 에이전트와 하네스를 나누는 설명부터 확인하세요.",
    sourceSection: slugHeading("에이전트가 하는 일과 하네스가 하는 일"),
    targetSection: slugHeading("‘에이전트’와 ‘하네스’는 어떻게 구분할까요?"),
  },
  {
    id: "harness-reuse-choice",
    sourceId: "ai-agent-harness",
    targetId: "agent-harness-build-or-reuse-2026",
    type: "deeper",
    reason:
      "하네스의 역할을 이해했다면, 직접 구현할 범위와 기존 실행 엔진을 재사용할 기준을 비교해 보세요.",
    sourceSection: slugHeading("실제로 어떤 에이전트들이 있나"),
    targetSection: slugHeading("6. 언제 만들고, 언제 가져다 쓸까?"),
  },
  {
    id: "reuse-persistent-runtime",
    sourceId: "agent-harness-build-or-reuse-2026",
    targetId: "persistent-work-agents",
    type: "deeper",
    reason:
      "장시간 실행을 맡길 때 달라지는 작업 공간, 시작 조건과 승인 구조를 더 살펴봅니다.",
    sourceSection: slugHeading(
      "2. 장시간 실행은 모델의 문제가 아니라 운영 구조의 문제이기도 하다",
    ),
    targetSection: slugHeading("대화 턴에서 상주하는 작업으로"),
  },
  {
    id: "persistent-harness-permissions",
    sourceId: "persistent-work-agents",
    targetId: "ai-agent-harness",
    type: "background",
    reason:
      "상주형 에이전트의 승인 경계를 이해하기 위해, 자율성과 실행 권한을 구분한 설명으로 돌아갑니다.",
    sourceSection: slugHeading("대화 턴에서 상주하는 작업으로"),
    targetSection: slugHeading("자율성과 권한: 에이전트에 맡기는 범위"),
  },
  {
    id: "cost-reuse-choice",
    sourceId: "ai-subscription-api-local-llm-cost-2026",
    targetId: "agent-harness-build-or-reuse-2026",
    type: "deeper",
    reason:
      "모델 비용 외에 실행 구조를 직접 만들고 유지하는 부담까지 비교하려면 이 선택 기준을 함께 보세요.",
    sourceSection: slugHeading("가성비는 하네스에서도 갈린다"),
    targetSection: slugHeading("6. 언제 만들고, 언제 가져다 쓸까?"),
  },
  {
    id: "jev-harness-loop",
    sourceId: "jev",
    targetId: "ai-agent-harness",
    type: "background",
    reason:
      "판단 모델이 들어갈 자리를 이해하기 위해 도구 호출과 실행 루프의 역할을 먼저 확인합니다.",
    sourceSection: slugHeading("6. Agent에서 왜 흥미로운가"),
    targetSection: slugHeading(
      "LLM이 도구를 요청하고, 실행기가 명령을 수행합니다",
    ),
  },
  {
    id: "army-saif-validation",
    sourceId: "agent-army-pr-1000",
    targetId: "saif-2026",
    type: "compare",
    reason:
      "에이전트의 수보다 결과 검증을 먼저 보자는 관점을, 포럼의 완료 조건 설명과 비교해 보세요.",
    sourceSection: slugHeading("핵심은 Agent의 수가 아니라 신뢰"),
    targetSection: slugHeading(
      "1. 에이전트의 출발점: 무엇을 완료로 인정할 것인가",
    ),
  },
  {
    id: "saif-harness-basics",
    sourceId: "saif-2026",
    targetId: "ai-agent-harness",
    type: "background",
    reason:
      "에이전트가 도구를 쓰고 결과를 확인하는 과정을, 실제 실행 기록을 따라 이해할 수 있습니다.",
    sourceSection: slugHeading(
      "1. 에이전트의 출발점: 무엇을 완료로 인정할 것인가",
    ),
    targetSection: slugHeading("실제 실행 기록: 실패한 테스트를 고친 과정"),
  },
  ...seminarResources.flatMap((seminar): Relation[] =>
    (seminar.companionIds ?? []).flatMap((articleId) => [
      {
        id: `${articleId}-to-seminar`,
        sourceId: articleId,
        targetId: seminar.id,
        type: "companion",
        reason:
          "같은 주제의 발표자료를 보며 개념의 흐름을 다시 정리할 수 있습니다.",
      },
      {
        id: `${seminar.id}-to-article`,
        sourceId: seminar.id,
        targetId: articleId,
        type: "companion",
        reason: "설명과 근거를 이어 읽으려면 대응하는 블로그 글을 함께 보세요.",
      },
    ]),
  ),
];

function sourceForArticle(id: string) {
  return matter(
    readFileSync(join(process.cwd(), "src/content/posts", `${id}.mdx`), "utf8"),
  ).content;
}

export function getResources(): Resource[] {
  const articles = getAllPostsMetadata({ includeDrafts: false }).map(
    ({ slug, data }): Resource => {
      const classification = articleClassification[slug] ?? {
        primaryTopic: "operations",
        topics: ["operations"],
      };
      const source = sourceForArticle(slug);
      // Approximate reading time excludes code fences, embedded SVG and markup.
      const prose = source
        .replace(/```[\s\S]*?```|~~~[\s\S]*?~~~/g, "")
        .replace(/<svg[\s\S]*?<\/svg>/g, "")
        .replace(/<[^>]*>/g, "");
      return {
        id: slug,
        format: "article",
        title: data.title,
        description: data.excerpt,
        href: `/blog/${slug}`,
        date: data.date,
        updated: data.updated,
        tags: data.tags,
        readingMinutes: Math.max(1, Math.ceil(prose.length / 650)),
        ...classification,
      };
    },
  );
  const publicIds = new Set(articles.map((article) => article.id));
  const resources = [
    ...articles,
    ...seminarResources.map((seminar) => ({
      ...seminar,
      companionIds: seminar.companionIds?.filter((id) => publicIds.has(id)),
    })),
  ];
  const ids = new Set(resources.map((resource) => resource.id));
  return resources
    .map((resource) => ({
      ...resource,
      companionIds: resource.companionIds?.filter((id) => ids.has(id)),
    }))
    .sort(
      (a, b) =>
        (b.date ?? "").localeCompare(a.date ?? "") || a.id.localeCompare(b.id),
    );
}

export function getResource(id: string): Resource | undefined {
  return getResources().find((resource) => resource.id === id);
}

export function getTopic(id: string): Topic | undefined {
  return [...topics, operationsTopic].find((topic) => topic.id === id);
}

export function getResourcesForTopic(topicId: string): Resource[] {
  return getResources().filter((resource) => resource.topics.includes(topicId));
}

export const getResourcesByTopic = getResourcesForTopic;

/** Filter both ends against the public catalog, even in the development server. */
export function getRelationsFrom(resourceId: string): Relation[] {
  const publicIds = new Set(getResources().map((resource) => resource.id));
  return relationDefinitions.filter(
    (relation) =>
      relation.sourceId === resourceId &&
      publicIds.has(relation.sourceId) &&
      publicIds.has(relation.targetId),
  );
}

export const getRelations = getRelationsFrom;

/** Fail the build/check when editorial links point to missing or private content. */
export function validateCatalog(): string[] {
  const errors: string[] = [];
  const resources = getResources();
  const byId = new Map(resources.map((resource) => [resource.id, resource]));
  const allTopics = [...topics, operationsTopic];
  const topicIds = new Set(allTopics.map((topic) => topic.id));
  const unique = (values: string[], label: string) => {
    const seen = new Set<string>();
    for (const value of values) {
      if (seen.has(value)) errors.push(`${label} 중복: ${value}`);
      seen.add(value);
    }
  };
  unique(
    resources.map((resource) => resource.id),
    "자료 ID",
  );
  unique(
    resources.map((resource) => resource.href),
    "대표 URL",
  );
  unique(
    allTopics.map((topic) => topic.id),
    "주제 ID",
  );
  unique(
    relationDefinitions.map((relation) => relation.id),
    "관계 ID",
  );
  unique(
    relationDefinitions.map(
      (relation) =>
        `${relation.sourceId}:${relation.targetId}:${relation.type}:${relation.sourceSection ?? ""}:${relation.targetSection ?? ""}`,
    ),
    "관계",
  );
  for (const resource of resources) {
    if (resource.format === "article" && !articleClassification[resource.id])
      errors.push(`${resource.id}: 글의 주제 분류를 등록해야 합니다.`);
    if (!resource.topics.includes(resource.primaryTopic))
      errors.push(`${resource.id}: 대표 주제가 소속 목록에 없습니다.`);
    for (const id of resource.topics)
      if (!topicIds.has(id)) errors.push(`${resource.id}: 없는 주제 ${id}`);
    for (const id of resource.companionIds ?? [])
      if (!byId.has(id)) errors.push(`${resource.id}: 없는 대응 자료 ${id}`);
  }
  for (const topic of allTopics)
    for (const question of topic.questions)
      for (const id of question.resourceIds) {
        const resource = byId.get(id);
        if (!resource) errors.push(`${topic.id}: 없는/비공개 질문 자료 ${id}`);
        else if (!resource.topics.includes(topic.id))
          errors.push(
            `${topic.id}: 질문 자료 ${id}의 주제가 일치하지 않습니다.`,
          );
      }
  const anchors = new Map(
    resources
      .filter((resource) => resource.format === "article")
      .map((resource) => [
        resource.id,
        new Set(
          getHeadings(sourceForArticle(resource.id)).map(
            (heading) => heading.id,
          ),
        ),
      ]),
  );
  for (const relation of relationDefinitions) {
    if (relation.sourceId === relation.targetId)
      errors.push(`${relation.id}: 자기 자신을 가리킵니다.`);
    for (const [id, section] of [
      [relation.sourceId, relation.sourceSection],
      [relation.targetId, relation.targetSection],
    ] as const) {
      if (!byId.has(id))
        errors.push(`${relation.id}: 없는/비공개 관계 자료 ${id}`);
      if (section && !anchors.get(id)?.has(section))
        errors.push(`${relation.id}: 없는 절 ${id}#${section}`);
    }
  }
  const publicArticles = resources.filter(
    (resource) => resource.format === "article",
  );
  if (
    publicArticles.length !==
    getAllPostsMetadata({ includeDrafts: false }).length
  )
    errors.push("공개 글이 카탈로그에서 누락되었습니다.");
  return errors;
}
