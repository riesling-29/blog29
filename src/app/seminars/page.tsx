import type { Metadata } from "next";
import Link from "next/link";
import { getResources } from "@/lib/catalog";
import { ResourceCard } from "@/components/resource-card";
export const metadata: Metadata = {
  title: "세미나",
  description: "발표자료와 해설을 연결한 세미나 아카이브.",
  alternates: { canonical: "/seminars" },
};
export default function SeminarsPage() {
  const seminars = getResources().filter((r) => r.format === "seminar");
  return (
    <main className="page-width index-page">
      <header className="archive-heading"><h1>세미나</h1><span>{seminars.length}개 · 읽기와 발표</span></header>
      <div className="seminar-index">
        {seminars.map((r, i) => (
          <ResourceCard key={r.id} resource={r} index={i} />
        ))}
      </div>
      <Link href="/topics" className="text-link">주제별로 글과 세미나 함께 보기 →</Link>
    </main>
  );
}
