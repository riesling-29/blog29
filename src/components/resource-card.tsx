import Link from "next/link";
import type { Resource } from "@/lib/catalog";
import { getTopic } from "@/lib/catalog";
import { formatDate } from "@/utils/formatDate";
export function ResourceCard({
  resource,
  index,
  compact = false,
}: {
  resource: Resource;
  index?: number;
  compact?: boolean;
}) {
  return (
    <article
      className={`resource-card${compact ? " resource-card--compact" : ""}`}
    >
      {index !== undefined && (
        <span className="resource-number" aria-hidden="true">
          {String(index + 1).padStart(2, "0")}
        </span>
      )}
      <div className="resource-copy">
        <div className="resource-meta">
          <span
            className={
              resource.format === "seminar"
                ? "format-label format-label--seminar"
                : "format-label"
            }
          >
            {resource.format === "seminar" ? "세미나" : "글"}
          </span>
          <span>{getTopic(resource.primaryTopic)?.label}</span>
          {resource.date && (
            <time dateTime={resource.date}>{formatDate(resource.date)}</time>
          )}
        </div>
        <h3>
          <Link href={resource.href}>
            {resource.title}
            <span className="link-arrow" aria-hidden="true">
              ↗
            </span>
          </Link>
        </h3>
        <p>{resource.description}</p>
        {resource.readingPurpose && (
          <span className="reading-purpose">{resource.readingPurpose}</span>
        )}
      </div>
    </article>
  );
}
