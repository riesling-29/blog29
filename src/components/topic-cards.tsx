import Link from "next/link";
import { topics, getResourcesByTopic } from "@/lib/catalog";
export function TopicCards() {
  return (
    <div className="topic-grid">
      {topics.map((topic, index) => {
        const resources = getResourcesByTopic(topic.id);
        return (
          <Link
            key={topic.id}
            href={`/topics/${topic.id}`}
            className={`topic-card topic-card--${index + 1}`}
          >
            <div className="topic-card-top">
              <span className="topic-number">0{index + 1}</span>
              <span>{resources.length}개 자료</span>
            </div>
            <h3>{topic.label}</h3>
            <p>{topic.description}</p>
            <span className="topic-card-link">
              주제 살펴보기 <span aria-hidden="true">→</span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}
