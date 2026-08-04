import type { Metadata } from "next";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "소개",
  description: "Blog29의 기록 원칙과 운영 방식",
};

const principles = [
  {
    number: "01",
    title: "사실과 해석을 구분합니다",
    description: "확인된 정보와 그 정보에서 도출한 판단이 섞이지 않도록 글의 구조를 나눕니다.",
  },
  {
    number: "02",
    title: "철회 조건을 남깁니다",
    description: "주장이 성립하는 근거뿐 아니라 어떤 증거가 나오면 판단을 바꿀지도 함께 기록합니다.",
  },
  {
    number: "03",
    title: "기록을 갱신합니다",
    description: "글은 완결된 선언보다 특정 시점의 판단에 가깝습니다. 변경 이력은 Git에 남습니다.",
  },
];

const stack = ["Next.js 16", "React 19", "TypeScript", "MDX", "Tailwind CSS", "Vercel"];

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
      <header className="max-w-4xl">
        <p className="font-mono text-xs tracking-[0.22em] text-emerald-300">ABOUT THE ARCHIVE</p>
        <h1 className="mt-5 text-5xl font-bold leading-[1.1] tracking-[-0.04em] text-white sm:text-7xl">
          결론보다 과정을,
          <span className="block text-slate-500">확신보다 근거를 보관합니다.</span>
        </h1>
        <p className="mt-8 max-w-3xl text-lg leading-8 text-slate-400">
          Blog29는 기술에 한정되지 않은 개인 기록 저장소입니다. 연구 메모, 도구 사용기,
          문화와 사회에 대한 관찰처럼 나중에 다시 검토할 가치가 있는 내용을 축적합니다.
        </p>
      </header>

      <section className="mt-20 grid gap-5 md:grid-cols-3" aria-labelledby="principles-heading">
        <h2 id="principles-heading" className="sr-only">기록 원칙</h2>
        {principles.map((principle) => (
          <article key={principle.number} className="rounded-2xl border border-white/10 bg-slate-900/50 p-6">
            <span className="font-mono text-xs text-emerald-300">{principle.number}</span>
            <h3 className="mt-8 text-xl font-semibold text-white">{principle.title}</h3>
            <p className="mt-3 leading-7 text-slate-500">{principle.description}</p>
          </article>
        ))}
      </section>

      <section className="mt-20 grid gap-10 border-t border-white/10 pt-12 lg:grid-cols-2">
        <div>
          <p className="font-mono text-xs tracking-[0.2em] text-slate-500">HOW IT WORKS</p>
          <h2 className="mt-4 text-3xl font-bold text-white">운영 방식</h2>
          <p className="mt-5 max-w-xl leading-8 text-slate-400">
            글은 데이터베이스가 아니라 저장소의 MDX 파일로 관리합니다. 따라서 글 수정도 코드 수정과 같은 방식으로
            검토할 수 있고, main 브랜치에 반영된 버전이 Vercel의 운영 배포 대상이 됩니다.
          </p>
          <a
            href={siteConfig.githubUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex text-sm font-semibold text-emerald-300 transition hover:text-emerald-200"
          >
            GitHub 저장소 보기 →
          </a>
        </div>

        <div>
          <p className="font-mono text-xs tracking-[0.2em] text-slate-500">BUILT WITH</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {stack.map((item) => (
              <span key={item} className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-slate-400">
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
