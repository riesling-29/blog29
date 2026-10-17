import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getResource, getResources } from "@/lib/catalog";
import { ReadingShell } from "@/components/reading-shell";
import { ResourceCard } from "@/components/resource-card";
type Props = { params: Promise<{ id: string }> };
export const dynamicParams = false;
export function generateStaticParams() {
  return getResources()
    .filter((r) => r.format === "seminar")
    .map((r) => ({ id: r.id }));
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params,
    r = getResource(id);
  return {
    title: r?.title ?? "세미나",
    description: r?.description,
    alternates: { canonical: `/seminars/${id}` },
  };
}
export default async function SeminarDetail({ params }: Props) {
  const { id } = await params,
    r = getResource(id);
  if (!r || r.format !== "seminar") notFound();
  const companions = (r.companionIds ?? [])
    .map(getResource)
    .filter((x) => x !== undefined);
  const headings = [
    { id: "overview", text: "세미나 소개", level: 2 },
    { id: "reading", text: "연결된 해설", level: 2 },
  ];
  return (
    <ReadingShell resource={r} headings={headings}>
      <article className="seminar-detail">
        <header className="seminar-detail-header">
          <p className="eyebrow">SEMINAR / 읽기와 발표</p>
          <h1 id="reading-title" tabIndex={-1}>
            {r.title}
          </h1>
          <p className="seminar-lead">{r.description}</p>
          <div className="seminar-actions">
            {companions[0] && (
              <Link className="solid-button" href={companions[0].href}>
                해설 읽기 <span aria-hidden="true">→</span>
              </Link>
            )}
            {r.slidesUrl && (
              <a className="outline-button" href={r.slidesUrl}>
                발표자료 열기 <span aria-hidden="true">↗</span>
              </a>
            )}
          </div>
          <p className="external-note">
            발표자료는 세미나 사이트에서 열립니다. 발표 화면의 해설 링크로
            연결된 글을 볼 수 있습니다.
          </p>
        </header>
        <section className="seminar-overview">
          <h2
            id="overview"
            data-reading-heading
            data-heading-title="세미나 소개"
          >
            세미나 소개
          </h2>
          <p>
            먼저 전체 흐름을 살펴보려면 발표자료를, 개념과 근거를 차근차근
            확인하려면 연결된 해설을 선택하세요.
          </p>
          {r.outline && (
            <ol>
              {r.outline.map((line, i) => (
                <li key={line}>
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  {line}
                </li>
              ))}
            </ol>
          )}
        </section>
        <section className="seminar-reading">
          <p className="eyebrow">CONTINUE READING</p>
          <h2
            id="reading"
            data-reading-heading
            data-heading-title="연결된 해설"
          >
            연결된 해설
          </h2>
          {companions.map((c) => (
            <ResourceCard key={c.id} resource={c} />
          ))}
        </section>
      </article>
    </ReadingShell>
  );
}
