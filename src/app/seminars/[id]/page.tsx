import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getResource, getResources } from "@/lib/catalog";
import { ReadingShell } from "@/components/reading-shell";
import { ResourceCard } from "@/components/resource-card";
import { getSeminarDocument } from "@/lib/seminars";
import { SeminarReader } from "@/components/seminar-reader";
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
  const document = getSeminarDocument(id);
  const headings = document.slides.map(slide => ({ id: slide.id, text: slide.title, level: 2 }));
  return (
    <ReadingShell resource={r} headings={headings}>
      <article className="seminar-detail">
        <header id="overview" className="seminar-detail-header">
          <p className="eyebrow">SEMINAR / 읽기와 발표</p>
          <h1 id="reading-title" tabIndex={-1}>
            {r.title}
          </h1>
          <p className="seminar-lead">{r.description}</p>
          <div className="seminar-actions">
            {companions[0] && <Link className="text-link" href={companions[0].href}>관련 글 읽기 →</Link>}
            {r.slidesUrl && <a className="text-link" href={r.slidesUrl}>기존 발표 화면 ↗</a>}
          </div>
        </header>
        <SeminarReader documentId={document.id} slides={document.slides} title={r.title} />
        <section className="seminar-reading">
          <p className="eyebrow">CONTINUE READING</p>
          <h2 id="reading">
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
