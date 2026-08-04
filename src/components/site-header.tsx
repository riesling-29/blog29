import Link from "next/link";

const navigation = [
  { href: "/", label: "홈" },
  { href: "/blog", label: "모든 글" },
  { href: "/about", label: "소개" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-white/8 bg-[#08111f]/85 backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-6 px-5 sm:px-8">
        <Link href="/" className="group flex items-center gap-3" aria-label="Blog29 홈">
          <span className="grid size-9 place-items-center rounded-full border border-emerald-300/30 bg-emerald-300/10 font-mono text-sm font-bold text-emerald-300 transition group-hover:border-emerald-300/60">
            29
          </span>
          <span>
            <strong className="block text-sm tracking-[0.18em] text-white">BLOG29</strong>
            <span className="hidden text-[0.65rem] tracking-[0.16em] text-slate-500 sm:block">
              NOTES & OBSERVATIONS
            </span>
          </span>
        </Link>

        <nav aria-label="주요 메뉴">
          <ul className="flex items-center gap-1 text-sm text-slate-400 sm:gap-3">
            {navigation.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block rounded-full px-3 py-2 transition hover:bg-white/5 hover:text-white"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
