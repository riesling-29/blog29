import Link from "next/link";
import { siteConfig } from "@/config/site";
export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="page-width footer-inner">
        <div>
          <Link className="brand" href="/">
            Blog<span className="brand-mark">29.</span>
          </Link>
          <p>질문을 남기고, 생각을 연결합니다.</p>
        </div>
        <nav aria-label="하단 메뉴">
          <Link href="/topics">주제별 탐색</Link>
          <Link href="/archive">아카이브</Link>
          <a href={siteConfig.githubUrl}>GitHub ↗</a>
        </nav>
        <p className="copyright">© {new Date().getFullYear()} riesling29</p>
      </div>
    </footer>
  );
}
