import type { Metadata } from "next";
import { TopicCards } from "@/components/topic-cards";
export const metadata: Metadata = {
  title: "주제별 탐색",
  description: "질문을 따라 글과 세미나를 함께 살펴보세요.",
  alternates: { canonical: "/topics" },
};
export default function TopicsPage() {
  return (
    <main className="page-width index-page">
      <header className="page-intro">
        <p className="eyebrow">EXPLORE BY TOPIC</p>
        <h1>질문에서 시작하는 탐색.</h1>
        <p>
          넓은 주제에서 지금 필요한 질문으로.
          <br />
          같은 주제의 글과 세미나를 한곳에서 찾아보세요.
        </p>
      </header>
      <TopicCards />
    </main>
  );
}
