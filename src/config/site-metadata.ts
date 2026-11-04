import type { Metadata } from "next";
import { siteConfig } from "./site";

/** Shared Open Graph defaults — spread in page metadata so child routes do not wipe layout fields. */
export const siteOpenGraphDefaults: NonNullable<Metadata["openGraph"]> = {
  type: "website",
  locale: "ko_KR",
  siteName: siteConfig.name,
  title: siteConfig.name,
  description: siteConfig.description,
  images: [
    {
      url: "/og.png",
      width: 1200,
      height: 630,
      alt: "Blog29 — Notes & Observations",
    },
  ],
};

/** Shared Twitter card defaults. */
export const siteTwitterDefaults: NonNullable<Metadata["twitter"]> = {
  card: "summary_large_image",
  title: siteConfig.name,
  description: siteConfig.description,
  images: ["/og.png"],
};

export function mergeOpenGraph(
  overrides: Partial<NonNullable<Metadata["openGraph"]>>,
): NonNullable<Metadata["openGraph"]> {
  return {
    ...siteOpenGraphDefaults,
    ...overrides,
    images: overrides.images ?? siteOpenGraphDefaults.images,
  };
}

export function mergeTwitter(
  overrides: Partial<NonNullable<Metadata["twitter"]>>,
): NonNullable<Metadata["twitter"]> {
  return {
    ...siteTwitterDefaults,
    ...overrides,
    images: overrides.images ?? siteTwitterDefaults.images,
  };
}
