/** Validate imported reader documents without fetching any upstream content. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const counts = { 'ai-agent-harness-seminar': 35, 'persistent-work-agents-seminar': 10, 'saif-2026-seminar': 30 };
let total = 0, notes = 0;
for (const [id, count] of Object.entries(counts)) {
  const doc = JSON.parse(readFileSync(resolve(root, `src/content/seminars/${id}.json`), 'utf8'));
  assert.equal(doc.id, id);
  assert.equal(doc.version, 1);
  assert.match(doc.sourceCommit, /^[a-f0-9]{40}$/);
  assert.match(doc.sourceSha256, /^[a-f0-9]{64}$/);
  assert.equal(doc.slides.length, count);
  const ids = new Set(doc.slides.map(s => s.id));
  for (const [index, slide] of doc.slides.entries()) {
    assert.equal(slide.number, index + 1);
    total++;
    assert(slide.title.trim() && slide.html.trim());
    assert(!/<(?:script|style|iframe|object|embed|form|button|h1)\b|\son\w+\s*=|javascript\s*:|\bsrcdoc\s*=/i.test(slide.html), `${id}/${slide.id}: unsupported active content`);
    assert(!/<[A-Z][A-Za-z]+\b/.test(slide.html), 'Vue components must be expanded');
    assert(!/href="https:\/\/blog29\.vercel\.app\//.test(slide.html), 'Internal references must stay in the current deployment');
    for (const match of slide.html.matchAll(/\bid="([^"]+)"/g)) { assert(!ids.has(match[1]), `Duplicate id ${match[1]}`); ids.add(match[1]); }
    for (const source of slide.sources) assert.match(source.url, /^https:\/\//);
    assert(!/<(?:script|style|iframe|object|embed|form)\b|\son\w+\s*=|javascript\s*:|\bsrcdoc\s*=/i.test(slide.notesHtml), 'Speaker notes must not contain active content');
    if (slide.notesHtml) notes++;
  }
  for (const slide of doc.slides) for (const match of slide.html.matchAll(/href="#([^"]+)"/g)) assert(ids.has(match[1]), `${id}: missing anchor ${match[1]}`);
  if (id === 'ai-agent-harness-seminar') {
    assert(doc.slides.some(s => s.html.includes('system-boundary') && s.html.includes('AI 에이전트')), 'AgentSystem diagram was lost');
    for (const term of ['function_call_output','tool_use_id','tool_response']) assert(doc.slides.some(s=>s.html.includes(term)), `Missing API example ${term}`);
    assert(doc.slides.every(s=>s.notesHtml), 'Speaker notes must not disappear');
  }
  if (id === 'persistent-work-agents-seminar') {
    for (const kind of ['fact','hypothesis','unavailable']) assert(doc.slides.some(s => s.html.includes(`data-kind="${kind}"`)), `Missing evidence level ${kind}`);
    assert(doc.slides.every(s=>s.notesHtml));
  }
}
console.log(`Seminar documents valid: ${total} sections, ${notes} speaker notes; IDs, citations, diagrams and evidence labels checked.`);
