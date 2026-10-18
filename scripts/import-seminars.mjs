/** Import reviewed public seminar sources; no network or runtime cross-repo dependency. */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(process.argv[2] ?? resolve(root, '../Seminars'));
const requireSource = createRequire(resolve(source, 'ai-agent-harness-seminar/package.json'));
const { parseSync } = await import(pathToFileURL(requireSource.resolve('@slidev/parser')).href);
const MarkdownIt = requireSource('markdown-it');
const { decodeHTML } = requireSource('entities');
const markdown = new MarkdownIt({ html: true });
const notesMarkdown = new MarkdownIt({ html: false, linkify: true, breaks: true });
const sourceCommit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: source, encoding: 'utf8' }).trim();
const ids = ['ai-agent-harness-seminar', 'persistent-work-agents-seminar', 'saif-2026-seminar'];
const strip = html => decodeHTML(html.replace(/<br\s*\/?\s*>/gi, ' ').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim());
const escape = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const checksum = s => createHash('sha256').update(s).digest('hex');
const output = resolve(root, 'src/content/seminars');
mkdirSync(output, { recursive: true });

function normalize(html, slideId, anchorMap) {
  html = html.replace(/<!--[\s\S]*?-->/g, '').replace(/\sstyle="[^"]*"/g, '');
  if (/<(?:script|style|iframe|object|embed|form|button)\b|\son\w+\s*=|javascript\s*:|\bsrcdoc\s*=/i.test(html)) throw new Error(`Unsupported active content in ${slideId}`);
  html = html.replace(/\s(target="_blank"|rel="noreferrer")/g, '');
  html = html.replace(/href="https:\/\/blog29\.vercel\.app([^"#]*)(#[^"]*)?"/g, (_, path, hash) => `href="${path || '/'}${hash ?? ''}"`);
  html = html.replace(/href="#([^"]+)"/g, (_, id) => `href="#${anchorMap[id] ?? `${slideId}-${id}`}"`);
  html = html.replace(/\bid="([^"]+)"/g, (_, id) => `id="${slideId}-${id}"`);
  html = html.replace(/aria-labelledby="([^"]+)"/g, (_, value) => `aria-labelledby="${value.split(/\s+/).map(id => `${slideId}-${id}`).join(' ')}"`);
  html = html.replace(/<(\/?)(h[1-6])\b/g, (_, close, tag) => `<${close}h${Math.min(6, Number(tag[1]) + 1)}`);
  // Keep tables inside their own scroll region instead of widening the reader.
  html = html.replace(/<table\b/g, '<div class="seminar-table-scroll" role="region" aria-label="표" tabindex="0"><table').replace(/<\/table>/g, '</table></div>');
  if (/<[A-Z][A-Za-z]+\b/.test(html)) throw new Error(`Unexpanded Vue component in ${slideId}`);
  if (/\bsrc="(?!https?:|data:)[^"]+"/.test(html)) throw new Error(`Local assets need an explicit import mapping in ${slideId}`);
  return html.trim();
}

for (const id of ids) {
  const filename = id === 'saif-2026-seminar' ? 'index.html' : 'slides.md';
  const raw = readFileSync(resolve(source, id, filename), 'utf8');
  const dependencies = {};
  let slides;
  if (filename === 'slides.md') {
    const parsed = parseSync(raw);
    slides = parsed.slides.map((slide, index) => {
      let body = slide.content;
      if (body.includes('<AgentSystem')) {
        const component = readFileSync(resolve(source, id, 'components/AgentSystem.vue'), 'utf8');
        dependencies['components/AgentSystem.vue'] = checksum(component);
        const template = component.match(/<template>([\s\S]*?)<\/template>/)?.[1];
        if (!template || /\{\{|\bv-|<script/.test(template)) throw new Error('AgentSystem requires a static rendering adapter.');
        body = body.replace(/<AgentSystem\s*\/>/g, template);
      }
      body = body.replace(/<Ev\s+kind="(fact|hypothesis|unavailable)"(?:\s+note="([^"]*)")?\s*\/>/g, (_, kind, note) => {
        const defaults = { fact: '공식 자료', hypothesis: '가설', unavailable: '공식 자료 없음' };
        return `<span class="ev" data-kind="${kind}"><b>${kind.toUpperCase()}</b><span>${escape(note ?? defaults[kind])}</span></span>`;
      });
      const match = body.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
      const title = match ? strip(match[1]) : slide.title || `자료 ${index + 1}`;
      if (match) body = body.replace(match[0], '');
      const fm = slide.frontmatter;
      const sources = fm.sources ?? (fm.source ? [{ name: fm.sourceName ?? '근거 자료', url: fm.source }] : []);
      return { id: `slide-${String(index + 1).padStart(2, '0')}`, number: index + 1, title, section: fm.section ?? '', html: markdown.render(body), notesHtml: slide.note ? notesMarkdown.render(slide.note) : '', sources };
    });
    if (id === 'persistent-work-agents-seminar') dependencies['components/Ev.vue'] = checksum(readFileSync(resolve(source, id, 'components/Ev.vue'), 'utf8'));
  } else {
    const matches = [...raw.matchAll(/<section\b[^>]*class="chapter[^\"]*"[^>]*>[\s\S]*?<\/section>/g)];
    if (matches.length !== 30) throw new Error(`Expected 30 SAIF chapters, found ${matches.length}`);
    const anchors = {};
    matches.forEach((match, index) => {
      const old = match[0].match(/^<section[^>]*\bid="([^"]+)"/)?.[1];
      anchors[old] = anchors[`h-${old}`] = `slide-${String(index + 1).padStart(2, '0')}`;
    });
    slides = matches.map((match, index) => {
      let body = match[0].replace(/^<section[^>]*>/, '').replace(/<\/section>$/, '');
      const titleMatch = body.match(/<h[12]\b[^>]*>([\s\S]*?)<\/h[12]>/);
      const title = strip(titleMatch?.[1] ?? `자료 ${index + 1}`);
      body = body.replace(titleMatch?.[0] ?? '', '');
      const sectionMatch = body.match(/<p class="eyebrow">([\s\S]*?)<\/p>/);
      const section = strip(sectionMatch?.[1] ?? '').replace(/^\d+\s*\/\s*\d+\s*/, '');
      body = body.replace(sectionMatch?.[0] ?? '', '');
      return { id: `slide-${String(index + 1).padStart(2, '0')}`, number: index + 1, title, section, html: body, notesHtml: '', sources: [] };
    });
    slides.forEach(slide => { slide.html = normalize(slide.html, slide.id, anchors); });
  }
  if (filename === 'slides.md') slides.forEach(slide => { slide.html = normalize(slide.html, slide.id, {}); });
  const snapshot = { version: 1, id, sourceRepository: 'riesling-29/Seminars', sourceCommit, sourceFile: `${id}/${filename}`, sourceSha256: checksum(raw), dependencies, slides };
  writeFileSync(resolve(output, `${id}.json`), JSON.stringify(snapshot, null, 2) + '\n');
  console.log(`${id}: ${slides.length} sections imported`);
}
