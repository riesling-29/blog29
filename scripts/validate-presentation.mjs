/** Fixed-master contract. These checks do not claim browser visual/layout coverage. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PRESENTATION_MASTER as master, fitPresentation } from '../src/lib/presentation-fit.ts';
const viewports = [{width:296,height:360},{width:366,height:510},{width:820,height:200},{width:984,height:510},{width:1856,height:850},{width:2500,height:1300}];
for (const viewport of viewports) {
  const fit = fitPresentation(viewport), epsilon = .000001;
  assert(fit.width <= viewport.width + epsilon && fit.height <= viewport.height + epsilon);
  assert(Math.abs(fit.width / fit.height - 16/9) < epsilon);
  assert(!('contentScale' in fit), 'Per-page content scaling must never return.');
}
assert.deepEqual([master.titleSize,master.subtitleSize,master.bodySize,master.tableSize,master.captionSize],[40,26,22,18,14]);
assert(master.titleTop + master.titleHeight < master.bodyTop);
assert(master.bodyTop + master.bodyHeight < master.footerTop);
assert(master.footerTop < master.height);
const css = readFileSync(new URL('../src/components/seminar-presentation.css',import.meta.url),'utf8');
const reader = readFileSync(new URL('../src/components/seminar-reader.css',import.meta.url),'utf8');
assert(!/content-scale|content-left|content-top|font-size:\s*(?:clamp|min|max)\(/.test(css), 'Presentation positions/type cannot depend on per-page content or viewport.');
assert(!/--content-scale/.test(reader), 'The old shrink-to-fit override must be removed.');
for (const token of ['titleSize','subtitleSize','bodySize','tableSize','captionSize','titleTop','titleHeight','bodyTop','bodyHeight','footerTop']) assert(css.includes(`var(--master-${token})`), `Unused master token ${token}`);
console.log(`Presentation master valid: ${viewports.length} viewport fits; fixed title/body/footer positions and type scale; no page-specific shrinking.`);
