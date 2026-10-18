/** Verify authored seminar compositions. This checks DOM content, not rendered layout. */
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { SEMINAR_EDITIONS, composeSeminarSection, preservedText } from '../src/lib/presentation-editorial.ts';

const { window } = new JSDOM('');
for (const name of ['document', 'Node', 'Element', 'HTMLElement', 'HTMLTableElement']) globalThis[name] = window[name];
const directory = new URL('../src/content/seminars/', import.meta.url);
const expectedSections = { 'ai-agent-harness-seminar': 35, 'persistent-work-agents-seminar': 10, 'saif-2026-seminar': 30 };
const files = readdirSync(directory).filter(name => name.endsWith('.json')).sort();
assert.deepEqual(files.map(name => name.replace(/\.json$/, '')), Object.keys(expectedSections).sort(), 'Every imported seminar must have an editorial regression check.');
assert.deepEqual(Object.keys(SEMINAR_EDITIONS).sort(), Object.keys(expectedSections).sort(), 'Every seminar must have one authored edition.');

function parse(html) {
  const root = document.createElement('div');
  root.innerHTML = html;
  return root;
}

function withoutRepeats(root) {
  const copy = root.cloneNode(true);
  copy.querySelectorAll('[data-presentation-repeat]').forEach(node => node.remove());
  return copy;
}

function links(root) {
  return Array.from(root.querySelectorAll('a[href]'), link => [link.getAttribute('href'), preservedText(link)]);
}

function tableRows(table) {
  return Array.from(table.rows, row => Array.from(row.cells, cell => ({
    tag: cell.tagName,
    text: cell.textContent,
    colspan: cell.colSpan,
    rowspan: cell.rowSpan,
  })));
}

function assertTablesPreserved(before, after, label) {
  const originals = Array.from(before.querySelectorAll('table'));
  const fragments = Array.from(after.querySelectorAll('table'));
  let nextFragment = 0;
  for (const [index, table] of originals.entries()) {
    const expected = tableRows(table);
    const actual = [];
    do {
      assert(nextFragment < fragments.length, `${label}: table ${index + 1} lost a continuation.`);
      actual.push(...tableRows(fragments[nextFragment++]));
    } while (actual.length < expected.length);
    assert.deepEqual(actual, expected, `${label}: table ${index + 1} must keep every row and cell in order, with repeated headers excluded.`);
  }
  assert.equal(nextFragment, fragments.length, `${label}: unexpected or duplicated source table.`);
}

// A page can be brief (especially a cover), but must contain visible content beyond
// navigation, a heading, an evidence badge, a decorative arrow, or hidden text.
function hasSubstantiveContent(root) {
  const copy = withoutRepeats(root);
  copy.querySelectorAll('h1,h2,h3,h4,h5,h6,.sr-only,[hidden],[aria-hidden="true"],.ev,.badge,.evidence-badge,.title-row,.product-head,.arrow,.recap-arrow').forEach(node => node.remove());
  const words = (copy.textContent ?? '').replace(/\b(?:FACT|HYPOTHESIS|UNAVAILABLE)\b/gi, '');
  return /[\p{L}\p{N}]/u.test(words) || Boolean(copy.querySelector('img[src],svg,math'));
}

for (const html of [
  '<h3>제목만 있는 페이지</h3>',
  '<div class="sr-only">화면에는 보이지 않는 내용</div>',
  '<div class="title-row"><span class="ev" data-kind="fact"><b>FACT</b><span>공식 자료</span></span></div>',
  '<div>→ ↔ ↓ •</div>',
  '<div>FACT HYPOTHESIS UNAVAILABLE</div>',
]) assert.equal(hasSubstantiveContent(parse(html)), false, `Reject a page with no substantive content: ${html}`);
assert(hasSubstantiveContent(parse('<p>다음 단계</p>')), 'Do not impose an arbitrary minimum length on a deliberate cover or short statement.');

let sections = 0;
let pages = 0;
let notes = 0;
let tables = 0;
let codeBlocks = 0;
const pageCounts = {};
for (const filename of files) {
  const file = new URL(filename, directory);
  const bytes = readFileSync(file, 'utf8');
  const doc = JSON.parse(bytes);
  const originalDocument = JSON.stringify(doc);
  assert.equal(doc.slides.length, expectedSections[doc.id]);
  assert.equal(SEMINAR_EDITIONS[doc.id].length, doc.slides.length, `${doc.id}: exactly one plan per original section.`);
  pageCounts[doc.id] = 0;
  for (const [index, slide] of doc.slides.entries()) {
    const label = `${doc.id}/${slide.id}`;
    const originalSlide = JSON.stringify(slide);
    const before = parse(slide.html);
    const parts = composeSeminarSection(slide, doc.id, index);
    assert(parts.length > 0, `${label}: no source section may disappear.`);
    assert.equal(parts.map(preservedText).join(''), preservedText(before), `${label}: every source character must remain in its original order (ignoring whitespace and marked repetition).`);
    for (const [partIndex, part] of parts.entries()) {
      assert(part.classList.contains('editorial-page') && part.dataset.layout, `${label}/${partIndex + 1}: missing editorial layout.`);
      assert(hasSubstantiveContent(part), `${label}/${partIndex + 1}: standalone heading, evidence badge, arrow, or hidden-only page.`);
      assert.equal(part.querySelectorAll('[id]').length, 0, `${label}: presentation must not duplicate reading anchor IDs.`);
      assert.equal(part.querySelectorAll('details').length, 0, `${label}: presentation text must not be hidden in a disclosure.`);
    }
    const after = document.createElement('div');
    after.append(...parts.map(withoutRepeats));
    assert.deepEqual(links(after), links(before), `${label}: every source link and its label must remain in order.`);
    assert.deepEqual(
      Array.from(after.querySelectorAll('[data-original-id]'), node => node.dataset.originalId),
      Array.from(before.querySelectorAll('[id]'), node => node.id),
      `${label}: source IDs must remain traceable through data-original-id.`,
    );
    assertTablesPreserved(before, after, label);
    for (const selector of ['pre', 'code']) {
      assert.deepEqual(
        Array.from(after.querySelectorAll(selector), node => node.textContent),
        Array.from(before.querySelectorAll(selector), node => node.textContent),
        `${label}: each ${selector} block must remain intact, including its whitespace; no word-level splitting.`,
      );
    }
    assert.equal(JSON.stringify(slide), originalSlide, `${label}: composition must not mutate source text, titles, notes, or metadata.`);
    sections++;
    pages += parts.length;
    pageCounts[doc.id] += parts.length;
    if (slide.notesHtml) notes++;
    tables += before.querySelectorAll('table').length;
    codeBlocks += before.querySelectorAll('pre').length;
  }
  assert.equal(JSON.stringify(doc), originalDocument, `${doc.id}: imported document was mutated.`);
  assert.equal(readFileSync(file, 'utf8'), bytes, `${doc.id}: source JSON must remain byte-for-byte unchanged.`);
}
assert.equal(sections, 75);
assert.equal(notes, 45, 'All 45 original speaker notes must remain untouched.');
window.close();
console.log(`Seminar editorial compositions valid: ${sections} source sections → ${pages} authored pages; ${notes} unchanged notes, ${tables} tables and ${codeBlocks} code blocks preserved. ${JSON.stringify(pageCounts)}. DOM checks only; browser layout remains untested.`);
