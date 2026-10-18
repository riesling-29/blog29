import Link from "next/link";
import type { ReactNode } from "react";
import {
  getResource,
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
import { TopicCorridor, SurroundingMap, questionFor } from "./knowledge-navigation";

const relationLabels: Record<Relation["type"], string> = {
  background: "배경 이해",
  deeper: "더 깊게",
  compare: "비교하기",
  companion: "함께 보기",
};

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
  const question = questionFor(resource);
  return (
    <main className="reading-page">
      <TopicCorridor topic={topic} resource={resource} />
      <nav aria-label="현재 위치" className="reading-breadcrumb"><ol>
        <li><Link href="/topics">전체 주제</Link></li>
        <li><Link href={`/topics/${resource.primaryTopic}`}>{topic?.label || "주제"}</Link></li>
        {question && <li><Link href={question.href}>{question.label}</Link></li>}
        <li aria-current="page">{resource.title}</li>
      </ol></nav>
      <div className="reading-grid">
        <div className="reading-main">
          <Link className="reader-back" href={question?.href ?? `/topics/${resource.primaryTopic}`}>← 주제 목록으로</Link>
          <ReturnToReading />
          <div className="reading-mobile-controls">
            <details><summary>주변 지도</summary>{topic && <SurroundingMap topic={topic} resource={resource} />}</details>
            <details><summary>이 글의 목차</summary><HeadingNavigation headings={headings} label="모바일 본문 목차" /></details>
          </div>
          {children}
        </div>
        <aside className="reading-side reading-side-toc">
          {topic && <SurroundingMap topic={topic} resource={resource} />}
          <div className="reader-outline"><h2 className="reading-side-label">이 글의 목차</h2>
            <HeadingNavigation headings={headings} />
            <a href="#reading-title" className="reading-top-link">처음으로 ↑</a>
          </div>
        </aside>
      </div>
    </main>
  );
}
