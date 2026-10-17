import Link from "next/link";
import type { Metadata } from "next";
import { getResources } from "@/lib/catalog";
import { ResourceCard } from "@/components/resource-card";
import { TopicCards } from "@/components/topic-cards";
export const metadata: Metadata = { alternates: { canonical: "/" } };
export default function Home() {
  const resources = getResources();
  const articles = resources.filter(
    (r) => r.format === "article" && r.primaryTopic !== "operations",
  );
  const seminars = resources.filter((r) => r.format === "seminar");
  return (
    <main className="home-page">
      <section className="home-hero page-width">
        <div className="edition-line">
          <span>기록 · 연구 · 세미나</span>
          <span>NOTES & CONNECTIONS</span>
        </div>
        <div className="hero-layout">
          <div>
            <p className="eyebrow">BLOG29 / 생각이 이어지는 곳</p>
            <h1>
              하나의 질문에서,
              <br />
              <em>다음 생각으로.</em>
            </h1>
            <p className="hero-description">
              기술과 연구에서 만난 질문을 기록합니다.
              <br className="desktop-break" /> 주제를 따라 읽고, 연결된 글과
              세미나에서 더 깊이 살펴보세요.
            </p>
            <Link className="text-link" href="#explore">
              궁금한 주제부터 시작하기 <span aria-hidden="true">↓</span>
            </Link>
          </div>
          <aside className="start-note" aria-labelledby="start-heading">
            <p className="eyebrow">처음 읽는다면</p>
            <h2 id="start-heading">
              AI는 어떻게
              <br />
              일을 수행할까?
            </h2>
            <p>
              모델, 에이전트, 하네스의 차이에서
              <br />
              직접 만들지, 재사용할지의 판단까지.
            </p>
            <ol className="reading-path">
              <li>
                <span>01</span>
                <Link href="/blog/ai-agent-harness">
                  에이전트와 하네스 이해하기
                </Link>
              </li>
              <li>
                <span>02</span>
                <Link href="/blog/agent-harness-build-or-reuse-2026">
                  직접 만들까, 재사용할까?
                </Link>
              </li>
              <li>
                <span>03</span>
                <Link href="/seminars/ai-agent-harness-seminar">
                  세미나로 구조 살펴보기
                </Link>
              </li>
            </ol>
            <div className="note-foot">
              입문에서 판단으로 <span aria-hidden="true">↗</span>
            </div>
          </aside>
        </div>
      </section>
      <section
        className="explore-section page-width"
        id="explore"
        aria-labelledby="explore-title"
      >
        <div className="section-heading">
          <div>
            <p className="eyebrow">EXPLORE BY TOPIC</p>
            <h2 id="explore-title">지금 어떤 것이 궁금한가요?</h2>
          </div>
          <Link href="/topics" className="text-link">
            주제별 탐색 <span aria-hidden="true">→</span>
          </Link>
        </div>
        <TopicCards />
      </section>
      <section
        className="journal-section page-width"
        aria-labelledby="journal-title"
      >
        <div className="section-heading">
          <div>
            <p className="eyebrow">THE JOURNAL</p>
            <h2 id="journal-title">최근의 생각들</h2>
          </div>
          <Link href="/blog" className="text-link">
            모든 글 <span aria-hidden="true">→</span>
          </Link>
        </div>
        <div className="journal-grid">
          {articles.slice(0, 4).map((r, i) => (
            <ResourceCard key={r.id} resource={r} index={i} />
          ))}
        </div>
      </section>
      <section className="seminar-section" aria-labelledby="seminar-title">
        <div className="page-width seminar-layout">
          <div className="seminar-intro">
            <p className="eyebrow">READ & PRESENT</p>
            <h2 id="seminar-title">
              혼자 읽고,
              <br />
              함께 이야기하는 지식.
            </h2>
            <p>
              발표자료와 해설을 연결했습니다.
              <br />
              익숙한 방식으로 골라 살펴보세요.
            </p>
            <Link className="text-link" href="/seminars">
              세미나 둘러보기 <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div>
            {seminars.map((r) => (
              <ResourceCard key={r.id} resource={r} compact />
            ))}
          </div>
        </div>
      </section>
      <section className="closing-note page-width">
        <span className="eyebrow">계속 이어지는 기록</span>
        <p>필요한 생각은, 다시 찾을 수 있도록.</p>
        <Link href="/archive" className="text-link">
          글과 세미나 통합 검색 <span aria-hidden="true">→</span>
        </Link>
      </section>
    </main>
  );
}
