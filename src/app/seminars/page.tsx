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
      <header className="page-intro">
        <p className="eyebrow">READ & PRESENT</p>
        <h1>함께 나누는 생각.</h1>
        <p>
          발표로 큰 흐름을 보고, 해설에서 근거와 세부 내용을 읽습니다.
          <br />
          세미나마다 두 가지 입구를 연결했습니다.
        </p>
      </header>
      <div className="seminar-index">
        {seminars.map((r, i) => (
          <ResourceCard key={r.id} resource={r} index={i} />
        ))}
      </div>
      <div className="collection-note">
        <p>질문에서 출발하고 싶으신가요?</p>
        <Link href="/topics" className="text-link">
          주제별로 글과 세미나 함께 보기 →
        </Link>
      </div>
    </main>
  );
}
