import Link from "next/link";
import type { ReactNode } from "react";
import {
  getResource,
  getResourcesForTopic,
  getTopic,
  type Relation,
  type Resource,
} from "@/lib/catalog";
import type { Heading } from "@/lib/headings";
import {
  HeadingNavigation,
  ReturnToReading,
} from "@/components/reading-navigation";
import "./reading.css";

const relationLabels: Record<Relation["type"], string> = {
  background: "배경 이해",
  deeper: "더 깊게",
  compare: "비교하기",
  companion: "함께 보기",
};

function TopicNeighbors({ resource }: { resource: Resource }) {
  const topic = getTopic(resource.primaryTopic);
  const neighbors = getResourcesForTopic(resource.primaryTopic);
  return (
    <nav aria-label="이 주제의 자료" className="reading-neighbors">
      <Link
        className="reading-topic-link"
        href={`/topics/${resource.primaryTopic}`}
      >
        {topic?.label || "주제 보기"} <span aria-hidden="true">↗</span>
      </Link>
      <ul>
        {neighbors.map((neighbor) => (
          <li key={neighbor.id}>
            <Link
              href={neighbor.href}
              aria-current={neighbor.id === resource.id ? "page" : undefined}
            >
              <span className="reading-resource-kind">
                {neighbor.format === "seminar" ? "세미나" : "글"}
                {neighbor.id === resource.id ? " · 현재 자료" : ""}
              </span>
              <span>{neighbor.title}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function RelatedResources({
  relations,
  label = "이 대목과 이어서 읽기",
}: {
  relations: Relation[];
  label?: string;
}) {
  const available = relations
    .map((relation) => ({ relation, target: getResource(relation.targetId) }))
    .filter((item) => item.target);
  if (!available.length) return null;
  return (
    <aside className="reading-related" aria-label={label}>
      <p className="reading-related-label">{label}</p>
      <ul>
        {available.map(({ relation, target }) => {
          if (!target) return null;
          const href = `${target.href}${relation.targetSection ? `#${encodeURIComponent(relation.targetSection)}` : ""}`;
          return (
            <li key={relation.id}>
              <span
                className={`reading-relation-type reading-relation-${relation.type}`}
              >
                {relationLabels[relation.type]}
              </span>
              <Link href={href}>
                {target.title} <span aria-hidden="true">↗</span>
              </Link>
              <p>
                {relation.reason}
                {relation.targetSection && (
                  <span className="reading-relation-destination">
                    {" "}
                    관련 절로 바로 이동합니다.
                  </span>
                )}
              </p>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

export function ReadingShell({
  resource,
  headings,
  children,
}: {
  resource: Resource;
  headings: Heading[];
  children: ReactNode;
}) {
  const topic = getTopic(resource.primaryTopic);
  return (
    <main className="reading-page">
      <nav aria-label="현재 위치" className="reading-breadcrumb">
        <ol>
          <li>
            <Link href="/">홈</Link>
          </li>
          <li>
            <Link href={`/topics/${resource.primaryTopic}`}>
              {topic?.label || "주제"}
            </Link>
          </li>
          <li aria-current="page">{resource.title}</li>
        </ol>
      </nav>
      <div className="reading-grid">
        <aside className="reading-side reading-side-topics">
          <p className="reading-side-label">이 주제의 자료</p>
          <TopicNeighbors resource={resource} />
        </aside>
        <div className="reading-main">
          <ReturnToReading />
          <div className="reading-mobile-controls">
            <details className="reading-topic-disclosure">
              <summary>
                주제 탐색 <span aria-hidden="true">＋</span>
              </summary>
              <TopicNeighbors resource={resource} />
            </details>
            <details className="reading-toc-disclosure">
              <summary>
                이 글의 목차 <span aria-hidden="true">＋</span>
              </summary>
              <HeadingNavigation headings={headings} label="모바일 본문 목차" />
            </details>
          </div>
          {children}
        </div>
        <aside className="reading-side reading-side-toc">
          <p className="reading-side-label">이 글의 목차</p>
          <HeadingNavigation headings={headings} />
          <a href="#reading-title" className="reading-top-link">
            처음으로 ↑
          </a>
        </aside>
      </div>
    </main>
  );
}
