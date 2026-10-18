/** Geometry checks only. These do not replace browser layout and interaction QA. */
import assert from 'node:assert/strict';
import { fitPresentation, SLIDE_WIDTH, SLIDE_HEIGHT } from '../src/lib/presentation-fit.ts';
let cases = 0;
for (const viewport of [{width: 296, height: 360}, {width: 366, height: 510}, {width: 820, height: 200}, {width: 984, height: 510}, {width: 1856, height: 850}, {width: 2500, height: 1300}]) {
  for (const content of [{width:1168,height:300}, {width:1168,height:632}, {width:1168,height:1600}, {width:1800,height:400}, {width:2400,height:2200}]) {
    const fit = fitPresentation(viewport,content), epsilon = .000001;
    assert(fit.width <= viewport.width + epsilon && fit.height <= viewport.height + epsilon, 'Canvas must fit both dimensions, including short landscape screens.');
    assert(Math.abs(fit.width / fit.height - 16/9) < epsilon, 'Slide aspect ratio must remain fixed.');
    assert(fit.contentTop + content.height * fit.contentScale <= SLIDE_HEIGHT - 44 + epsilon, 'Long content must remain above the footer.');
    assert(fit.contentLeft >= 56 - epsilon && fit.contentLeft + content.width * fit.contentScale <= SLIDE_WIDTH - 56 + epsilon, 'Wide content must remain inside the slide.');
    assert(fit.contentScale > 0 && fit.contentScale <= 1, 'Content may shrink without being enlarged beyond its designed size.');
    cases++;
  }
}
assert.equal(fitPresentation({width:1280,height:720},{width:1168,height:632}).contentScale,1);
console.log(`Presentation fit valid: ${cases} viewport/content combinations; 16:9 canvas and complete content stay within their bounds.`);
