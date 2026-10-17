import type { MetadataRoute } from "next";
import {
  getResources,
  operationsTopic,
  SITE_URL,
  topics,
  validateCatalog,
} from "@/lib/catalog";

export default function sitemap(): MetadataRoute.Sitemap {
  const errors = validateCatalog();
  if (errors.length > 0)
    throw new Error(`공개 카탈로그 검증 실패:\n${errors.join("\n")}`);
  const paths = [
    "",
    "/topics",
    "/blog",
    "/seminars",
    "/archive",
    "/about",
    ...[...topics, operationsTopic].map((topic) => `/topics/${topic.id}`),
  ];
  return [
    ...paths.map((path) => ({ url: `${SITE_URL}${path}` })),
    ...getResources().map((resource) => ({
      url: `${SITE_URL}${resource.href}`,
      ...((resource.updated ?? resource.date)
        ? { lastModified: resource.updated ?? resource.date }
        : {}),
    })),
  ];
}
