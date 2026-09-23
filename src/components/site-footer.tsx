import Link from "next/link";
import { siteConfig } from "@/config/site";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p>© {new Date().getFullYear()} riesling29 · Notes & Observations</p>
        <div className="flex gap-5">
          <Link href="/blog" className="transition hover:text-accent">
            글 목록
          </Link>
          <a
            href={siteConfig.githubUrl}
            target="_blank"
            rel="noreferrer"
            className="transition hover:text-accent"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}

