/** DOM regression tests with synthetic capacity, not a browser/pixel-layout test. */
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { buildPresentationPages, fitEditorialPage, hasPresentationContent } from '../src/lib/presentation-pages.ts';
import { preservedText } from '../src/lib/presentation-editorial.ts';
const { window } = new JSDOM('');
for (const name of ['document','Node','Element','HTMLElement','HTMLTableElement']) globalThis[name] = window[name];
globalThis.requestAnimationFrame = callback => setImmediate(() => callback(0));
function root(html) { const node=document.createElement('div');node.innerHTML=html;return node; }
function box(capacity) {
  const measure=document.createElement('div'), title=document.createElement('h2');
  Object.defineProperties(measure,{clientHeight:{get:()=>462},clientWidth:{get:()=>1168},scrollWidth:{get:()=>1168},scrollHeight:{get:()=>measure.textContent.length>capacity?463:462}});
  Object.defineProperties(title,{clientHeight:{get:()=>104},scrollHeight:{get:()=>104}});
  return [measure,title];
}
let count=0;
for(const filename of readdirSync(new URL('../src/content/seminars/',import.meta.url))) {
  if(!filename.endsWith('.json'))continue;
  const doc=JSON.parse(readFileSync(new URL(`../src/content/seminars/${filename}`,import.meta.url),'utf8'));
  for(const capacity of [600,900]) {
    const pages=await buildPresentationPages(doc.slides,...box(capacity),()=>false,doc.id);
    for(const [index,slide]of doc.slides.entries()) {
      const group=pages.filter(page=>page.sourceIndex===index);
      assert(group.length>0);
      assert.equal(group.map(page=>preservedText(root(page.html))).join(''),preservedText(root(slide.html)),`${doc.id}/${slide.id}: exact ordered source text`);
      assert.deepEqual(group.map(page=>page.part),group.map((_,i)=>i+1));
      assert(group.every(page=>page.parts===group.length && page.title===slide.title && page.sourceId===slide.id));
      for(const page of group) {
        assert(!/\sid="/.test(page.html));
        assert(hasPresentationContent(root(page.html).firstElementChild),'Every page needs visible substantive content.');
      }
      const after=root(group.map(page=>page.html).join(''));
      after.querySelectorAll('[data-presentation-repeat]').forEach(el=>el.remove());
      assert.deepEqual([...after.querySelectorAll('a[href]')].map(el=>el.getAttribute('href')),[...root(slide.html).querySelectorAll('a[href]')].map(el=>el.getAttribute('href')));
      assert.deepEqual([...after.querySelectorAll('pre')].map(el=>el.textContent),[...root(slide.html).querySelectorAll('pre')].map(el=>el.textContent),'Code examples cannot be cut into words or lines.');
    }
    count+=doc.slides.length;
  }
  assert.deepEqual(await buildPresentationPages(doc.slides,...box(600),()=>true,doc.id),[]);
}
for(const html of ['<div class="title-row"><b>FACT</b></div>','<span>→</span>','<p class="sr-only">caption that cannot be seen on the screen</p>','<p class="note">A trailing footnote must stay with its explanation.</p>'])assert(!hasPresentationContent(root(html)));
// Reproduces the former isolated badge/heading page with a deliberately small semantic capacity.
const regression=root('<div class="title-row"><span class="ev">FACT</span></div><div class="two"><section><h3>첫 설명</h3><p>첫 번째 설명의 문장을 제목과 함께 그대로 유지합니다.</p></section><section><h3>둘째 설명</h3><p>두 번째 설명의 문장도 한 단위로 함께 유지합니다.</p></section></div><p class="note">설명에 붙는 주석입니다.</p>');
regression.className='editorial-page';
const split=fitEditorialPage(regression,node=>node.querySelectorAll('section').length<=1);
assert.equal(split.length,2);
assert(split.every(hasPresentationContent));
assert.equal(split.map(preservedText).join(''),preservedText(regression));
assert(split[0].querySelector('.title-row') && split.at(-1).querySelector('.note'));
assert(split.every(page=>page.querySelector('h3') && page.querySelector('section p')));
// A diagram is indivisible: refusing an impossible fit is preferable to an arrow-only page.
const diagram=root('<div class="mathline"><span>처음의 설명을 그대로 보존합니다</span><span>→</span><span>마지막 설명을 함께 보존합니다</span></div>');
assert.throws(()=>fitEditorialPage(diagram,()=>false));
// Mixed inline punctuation must survive any fallback.
const links=root('<div class="refs"><div class="ref"><div>자료의 출처를 확인할 수 있는 상세 설명입니다.</div><a href="/a">첫 자료</a> · <a href="/b">두번째 자료</a></div><div class="ref"><p>추가 자료의 설명을 같은 순서로 그대로 보존합니다.</p></div></div>');
const linked=fitEditorialPage(links,node=>node.textContent.length<65);
assert.equal(linked.map(preservedText).join(''),preservedText(links));
window.close();
console.log(`Presentation pagination valid: ${count} source/capacity cases; orphan badge/arrow/hidden caption regression, whole code, exact text/links, cancellation. Synthetic capacity only.`);
