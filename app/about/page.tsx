"use client";

import { useState, useEffect } from "react";

export default function AboutPage() {
  const [visible, setVisible] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible((prev) => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.2 }
    );

    document.querySelectorAll("[data-animate]").forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const skills = [
    { name: "Next.js", category: "Framework" },
    { name: "TypeScript", category: "Language" },
    { name: "React", category: "Library" },
    { name: "Tailwind CSS", category: "Styling" },
    { name: "MDX", category: "Content" },
    { name: "Node.js", category: "Runtime" },
    { name: "Git", category: "Tool" },
    { name: "Vercel", category: "Platform" },
  ];

  return (
    <main className="min-h-screen bg-[#0f172a] text-gray-100">
      <div className="max-w-5xl mx-auto px-6 py-24">
        {/* Hero Section */}
        <section
          id="hero"
          data-animate
          className={`mb-24 text-center transition-all duration-700 ${
            visible["hero"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6">
            Hi, I'm{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
              Your Name
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            프론트엔드 개발자이자 기술 블로거입니다. <br />
            아름다운 UI와 매끄러운 사용자 경험을 만드는 것을 좋아합니다.
          </p>
        </section>

        {/* About Section */}
        <section
          id="about"
          data-animate
          className={`mb-24 transition-all duration-700 ${
            visible["about"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <h2 className="text-3xl font-bold text-white mb-6 border-l-4 border-emerald-400 pl-4">
            About Me
          </h2>
          <div className="space-y-4 text-gray-300 text-lg leading-relaxed">
            <p className="whitespace-pre-line">
              웹 개발과 기술 블로그 운영을 통해 꾸준히 성장하고 있는 개발자입니다.
              새로운 기술을 배우고, 그것을 실제로 적용해보는 것을 즐깁니다.
              특히 React 생태계를 기반으로 한 모던 웹 애플리케이션 개발에 관심이 많습니다.
            </p>
            <p className="whitespace-pre-line">
              기술 블로그를 운영하면서 배운 것들을 기록하고, 다른 개발자들과 지식을 공유하는 것을 좋아합니다.
              깔끔한 코드와 직관적인 UI/UX를 추구하는 개발자입니다.
              현재 Next.js와 TypeScript를 주로 사용하며, 정적 사이트 생성(SSG)과 서버 컴포넌트(Server Components)에 깊은 관심을 가지고 있습니다.
            </p>
          </div>
        </section>

        {/* Skills Section */}
        <section
          id="skills"
          data-animate
          className={`mb-24 transition-all duration-700 ${
            visible["skills"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <h2 className="text-3xl font-bold text-white mb-6 border-l-4 border-emerald-400 pl-4">
            Tech Stack
          </h2>
          <div className="flex flex-wrap gap-3">
            {skills.map((skill) => (
              <span
                key={skill.name}
                className="px-4 py-2 rounded-full bg-[#1e293b] text-gray-300 text-sm border border-gray-700 hover:border-emerald-400 hover:text-emerald-400 transition-all duration-300 inline-flex items-center gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                {skill.name}
                <span className="text-gray-500 text-xs ml-1">{skill.category}</span>
              </span>
            ))}
          </div>
        </section>

        {/* Links Section */}
        <section
          id="links"
          data-animate
          className={`mb-24 transition-all duration-700 ${
            visible["links"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <h2 className="text-3xl font-bold text-white mb-6 border-l-4 border-emerald-400 pl-4">
            Connect
          </h2>
          <div className="flex flex-wrap gap-4">
            <a
              href="https://github.com/riesling-29"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 px-6 py-4 rounded-xl bg-[#1e293b] text-gray-300 hover:bg-emerald-500/10 hover:text-emerald-400 border border-gray-700 hover:border-emerald-400 transition-all duration-300"
            >
              <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.299-1.23 3.299-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.285 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              <span className="font-medium">GitHub</span>
              <span className="text-gray-500 text-sm group-hover:text-emerald-400 transition-colors">riesling-29</span>
            </a>

            <a
              href="mailto:hello@example.com"
              className="group flex items-center gap-3 px-6 py-4 rounded-xl bg-[#1e293b] text-gray-300 hover:bg-emerald-500/10 hover:text-emerald-400 border border-gray-700 hover:border-emerald-400 transition-all duration-300"
            >
              <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="font-medium">Email</span>
              <span className="text-gray-500 text-sm group-hover:text-emerald-400 transition-colors">hello@example.com</span>
            </a>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-24 pt-8 border-t border-gray-800 text-center text-gray-500 text-sm">
          <p>© {new Date().getFullYear()} Your Name. Built with Next.js & MDX.</p>
        </footer>
      </div>
    </main>
  );
}
