/** DOM structure/preservation tests with synthetic capacity. No browser layout is simulated. */
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { buildPresentationPages } from '../src/lib/presentation-pages.ts';
const { window } = new JSDOM('');
for (const name of ['document','Node','Element','HTMLElement','HTMLTableElement']) globalThis[name] = window[name];
globalThis.requestAnimationFrame = callback => setImmediate(() => callback(0));
function text(html) {
  const root = document.createElement('div'); root.innerHTML = html;
  root.querySelectorAll('[data-presentation-repeat]').forEach(el => el.remove());
  return (root.textContent ?? '').replace(/\s+/g,'');
}
function box(capacity) {
  const measure = document.createElement('div');
  Object.defineProperties(measure, {
    clientHeight:{get:()=>462}, clientWidth:{get:()=>1168}, scrollWidth:{get:()=>1168},
    scrollHeight:{get:()=>measure.textContent.length > capacity ? 463 : 462},
  });
  const title = document.createElement('h2');
  Object.defineProperties(title,{clientHeight:{get:()=>104},scrollHeight:{get:()=>104}});
  return [measure,title];
}
let sections = 0;
for (const filename of readdirSync(new URL('../src/content/seminars/',import.meta.url))) {
  if (!filename.endsWith('.json')) continue;
  const doc = JSON.parse(readFileSync(new URL(`../src/content/seminars/${filename}`,import.meta.url),'utf8'));
  for (const capacity of [240,1200]) {
    const pages = await buildPresentationPages(doc.slides,...box(capacity),()=>false);
    assert(pages.length >= doc.slides.length);
    for (const [index,slide] of doc.slides.entries()) {
      const group = pages.filter(page => page.sourceIndex === index);
      assert(group.length > 0);
      assert.equal(group.map(page => text(page.html)).join(''),text(slide.html),`${doc.id}/${slide.id}: preserve every character in source order`);
      assert.deepEqual(group.map(page=>page.part),group.map((_,i)=>i+1));
      assert(group.every(page => page.parts === group.length && page.title === slide.title && page.sourceId === slide.id));
      assert(group.every(page=> !/\sid="/.test(page.html)), 'Reading anchor IDs must not be duplicated.');
      const before = document.createElement('div');before.innerHTML=slide.html;
      const after = document.createElement('div');after.innerHTML=group.map(page=>page.html).join('');
      for (const link of before.querySelectorAll('a[href]')) assert(Array.from(after.querySelectorAll('a[href]')).some(next=>next.getAttribute('href')===link.getAttribute('href')),'A source link was lost.');
    }
    sections += doc.slides.length;
  }
}
const example = {id:'test',number:1,title:'분할 검증',section:'검사',notesHtml:'',sources:[],html:'<ol id="list" start="3"><li>첫 항목</li><li>'+('한글과 emoji 🧭를 보존합니다. '.repeat(80))+'</li></ol><pre><code>'+('line(value)\n'.repeat(120))+'</code></pre><details><summary>상세 설명</summary><p>'+('설명을 보존합니다. '.repeat(30))+'</p></details>'};
const continued = await buildPresentationPages([example],...box(100),()=>false);
assert.equal(continued.map(page=>text(page.html)).join(''),text(example.html));
assert(continued.length > 10);
assert(continued.every(page=> !page.html.includes('<details') && !/\sid="/.test(page.html)), 'Reading disclosures become noninteractive presentation blocks, without duplicate IDs.');
const table = {...example,html:'<table><thead><tr><th>항목</th><th>설명</th></tr></thead><tbody>'+Array.from({length:12},(_,i)=>`<tr><td>항목 ${i}</td><td>${'행 내용 '.repeat(10)}</td></tr>`).join('')+'</tbody></table>'};
const tablePages = await buildPresentationPages([table],...box(100),()=>false);
assert(tablePages.length > 1 && tablePages.some(page=>page.html.includes('data-presentation-repeat')),'Continued tables repeat column headings.');
assert.equal(tablePages.map(page=>text(page.html)).join(''),text(table.html));
assert.deepEqual(await buildPresentationPages([example],...box(100),()=>true),[],'Closing presentation cancels pagination.');
window.close();
console.log(`Presentation pagination valid: ${sections} source/capacity cases, Korean/emoji/code/list continuation, repeated table headings, links and text preservation. Synthetic capacity only; browser layout remains untested.`);
