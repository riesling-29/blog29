"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { Resource, Topic } from "@/lib/catalog";
import { formatDate } from "@/utils/formatDate";
export function ArchiveExplorer({
  resources,
  topics,
  initialFormat = "",
}: {
  resources: Resource[];
  topics: Topic[];
  initialFormat?: string;
}) {
  const search = useSearchParams(),
    router = useRouter();
  const q = search.get("q") ?? "",
    topic = search.get("topic") ?? "",
    rawFormat = search.get("format"),
    format = rawFormat === "all" ? "" : (rawFormat ?? initialFormat);
  const terms = q
    .normalize("NFKC")
    .toLocaleLowerCase()
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const filtered = resources.filter(
    (r) =>
      (!topic || r.topics.includes(topic)) &&
      (!format || r.format === format) &&
      terms.every((term) =>
        [r.title, r.description, ...r.tags]
          .join(" ")
          .normalize("NFKC")
          .toLocaleLowerCase()
          .includes(term),
      ),
  );
  function update(form: HTMLFormElement) {
    const data = new FormData(form);
    const params = new URLSearchParams();
    for (const key of ["q", "topic", "format"]) {
      const v = String(data.get(key) ?? "").trim();
      if (v) params.set(key, v);
      else if (key === "format" && initialFormat) params.set(key, "all");
    }
    router.replace(
      `${window.location.pathname}${params.size ? `?${params}` : ""}`,
      { scroll: false },
    );
  }
  return (
    <div className="archive-explorer">
      <form
        className="archive-controls"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          update(e.currentTarget);
        }}
      >
        <div className="archive-query">
          <label htmlFor="archive-q">통합 검색</label>
          <div>
            <input
              id="archive-q"
              name="q"
              type="search"
              defaultValue={q}
              key={q}
              placeholder="제목, 요약, 태그로 찾아보세요"
            />
            <button type="submit" className="solid-button">
              검색
            </button>
          </div>
        </div>
        <div className="filter-row">
          <label>
            주제
            <select
              name="topic"
              value={topic}
              onChange={(e) => update(e.currentTarget.form!)}
            >
              <option value="">모든 주제</option>
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
              <option value="operations">운영 기록</option>
            </select>
          </label>
          <label>
            자료 형식
            <select
              name="format"
              value={format}
              onChange={(e) => update(e.currentTarget.form!)}
            >
              <option value="">글과 세미나</option>
              <option value="article">글</option>
              <option value="seminar">세미나</option>
            </select>
          </label>
          {(q || topic || format) && (
            <Link href={windowPath(initialFormat)} className="reset-link">
              조건 지우기
            </Link>
          )}
        </div>
      </form>
      <div className="results-caption">
        <p role="status" aria-live="polite">
          {q && (
            <>
              <strong>“{q}”</strong> ·{" "}
            </>
          )}
          {filtered.length}개 자료
        </p>
        <span>최근 기록순</span>
      </div>
      <div className="archive-results">
        {filtered.map((r, i) => (
          <article className="resource-card" key={r.id}>
            <span className="resource-number" aria-hidden="true">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="resource-copy">
              <div className="resource-meta">
                <span
                  className={
                    r.format === "seminar"
                      ? "format-label format-label--seminar"
                      : "format-label"
                  }
                >
                  {r.format === "seminar" ? "세미나" : "글"}
                </span>
                <span>
                  {topics.find((t) => t.id === r.primaryTopic)?.label ??
                    "운영 기록"}
                </span>
                {r.date && <time dateTime={r.date}>{formatDate(r.date)}</time>}
              </div>
              <h2>
                <Link href={r.href}>
                  {r.title}
                  <span className="link-arrow" aria-hidden="true">
                    ↗
                  </span>
                </Link>
              </h2>
              <p>{r.description}</p>
              <div className="result-tags">
                {r.tags.slice(0, 4).map((tag) => (
                  <span key={tag}>#{tag}</span>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
      {!filtered.length && (
        <div className="empty-results">
          <h2>일치하는 자료가 없습니다.</h2>
          <p>검색어를 짧게 바꾸거나 주제·형식 조건을 풀어보세요.</p>
          <Link href="/archive" className="text-link">
            전체 자료 보기 →
          </Link>
        </div>
      )}
    </div>
  );
}
function windowPath(initialFormat: string) {
  return initialFormat === "article" ? "/blog" : "/archive";
}
