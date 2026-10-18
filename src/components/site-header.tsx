"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
const menu = [
  { href: "/topics", label: "주제별 탐색" },
  { href: "/about", label: "소개" },
];
export function SiteHeader() {
  const path = usePathname();
  return (
    <header className="site-header">
      <div className="header-inner page-width">
        <Link href="/" className="brand" aria-label="Blog29 홈">
          Blog<span className="brand-mark">29.</span>
        </Link>
        <nav aria-label="주요 메뉴">
          <ul>
            {menu.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={path.startsWith(item.href) ? "page" : undefined}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="header-tools">
          <Link
            className="search-link"
            href="/archive"
            aria-current={path === "/archive" ? "page" : undefined}
          >
            <svg
              viewBox="0 0 24 24"
              width="17"
              height="17"
              aria-hidden="true"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="10" cy="10" r="6.5" />
              <path d="m15 15 5 5" />
            </svg>
            <span>글·세미나 검색</span>
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
