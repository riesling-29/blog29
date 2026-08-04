import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-24">
      <div className="max-w-4xl w-full">
        <h1 className="text-center text-5xl font-extrabold text-white">
          Blog29
        </h1>
        <p className="mt-4 text-center text-zinc-400 text-lg">
          생각과 기록을 남기는 기술 블로그
        </p>

        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          <Link
            href="/blog"
            className="p-6 border border-zinc-800 rounded-xl hover:border-emerald-400/50 hover:bg-[#1e293b]/50 transition"
          >
            <h2 className="text-xl font-semibold text-white">
              📘 블로그 포스트
            </h2>
            <p className="mt-2 text-zinc-400">
              최신 글과 기술 기록을 확인하세요.
            </p>
          </Link>

          <Link
            href="/about"
            className="p-6 border border-zinc-800 rounded-xl hover:border-emerald-400/50 hover:bg-[#1e293b]/50 transition"
          >
            <h2 className="text-xl font-semibold text-white">
              👤 About Me
            </h2>
            <p className="mt-2 text-zinc-400">
              저에 대해 더 알아보세요.
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}
