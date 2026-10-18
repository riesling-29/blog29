import Link from "next/link";
import type { ComponentProps } from "react";

/** Keep MDX links as real anchors while same-site navigation preserves reading history. */
export function ContextualLink({
  href,
  children,
  ...props
}: ComponentProps<"a">) {
  if (!href) return <a {...props}>{children}</a>;
  if (href.startsWith("/") || href.startsWith("#")) {
    return (
      <Link href={href} {...props}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} {...props}>
      {children}
    </a>
  );
}
