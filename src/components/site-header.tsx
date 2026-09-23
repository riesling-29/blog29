import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-5 gap-y-3 px-5 py-5 sm:px-8 sm:py-6">
        <Link href="/" className="brand" aria-label="Blog29 홈">Blog<span className="brand-mark">29.</span></Link>
        <div className="flex items-center gap-4 sm:gap-8">
          <nav aria-label="주요 메뉴">
            <ul className="flex gap-4 text-sm text-muted sm:gap-6">
              <li><Link href="/blog" className="hover:text-accent">모든 글</Link></li>
              <li><Link href="/about" className="hover:text-accent">소개</Link></li>
            </ul>
          </nav>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
