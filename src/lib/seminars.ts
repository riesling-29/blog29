import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getResources } from "./catalog";

export type SeminarSlide = {
  id: string;
  number: number;
  title: string;
  section: string;
  html: string;
  notesHtml: string;
  sources: { name: string; url: string }[];
};
export type SeminarDocument = {
  version: number;
  id: string;
  sourceRepository: string;
  sourceCommit: string;
  sourceFile: string;
  sourceSha256: string;
  dependencies: Record<string, string>;
  slides: SeminarSlide[];
};

export function getSeminarDocument(id: string): SeminarDocument {
  if (!getResources().some(r => r.id === id && r.format === "seminar")) {
    throw new Error(`공개 세미나가 아닙니다: ${id}`);
  }
  const document = JSON.parse(readFileSync(join(process.cwd(), "src/content/seminars", `${id}.json`), "utf8")) as SeminarDocument;
  if (document.version !== 1 || document.id !== id || !document.slides.length) throw new Error(`세미나 원문 형식을 확인하세요: ${id}`);
  return document;
}
