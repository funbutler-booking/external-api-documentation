import { Marked, Token, Tokens } from 'marked';
import { fileToRoute } from './docs.service';

export interface Example {
  title: string;
  lang: string;
  code: string;
}

export interface Section {
  id: string;
  html: string;
  examples: Example[];
}

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

/** Minimal JSON / HTTP highlighter; good enough for example payloads without pulling in a library. */
export function highlight(code: string, lang: string): string {
  const esc = escapeHtml(code);
  if (lang === 'json') {
    return esc.replace(
      /(&#34;(?:[^&]|&(?!#34;))*?&#34;)(\s*:)?|\b(true|false|null)\b|(-?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b)/g,
      (m, str, colon, kw, num) => {
        if (str) return `<span class="${colon ? 'tk-key' : 'tk-str'}">${str}</span>${colon ?? ''}`;
        if (kw) return `<span class="tk-kw">${kw}</span>`;
        if (num) return `<span class="tk-num">${num}</span>`;
        return m;
      },
    );
  }
  if (lang === 'http' || lang === '') {
    return esc.replace(
      new RegExp(`^(${METHODS.join('|')})(\\s+\\S+)`, 'gm'),
      '<span class="tk-kw">$1</span><span class="tk-str">$2</span>',
    );
  }
  return esc;
}

function parseInfo(info: string | undefined): { lang: string; title?: string } {
  const raw = (info ?? '').trim();
  const title = raw.match(/title="([^"]*)"/)?.[1];
  const lang = raw.replace(/title="[^"]*"/, '').trim().split(/\s+/)[0] ?? '';
  return { lang, title };
}

function resolve(fromPath: string, href: string): string {
  const base = fromPath.includes('/') ? fromPath.slice(0, fromPath.lastIndexOf('/') + 1) : '';
  const parts = (base + href).split('/');
  const out: string[] = [];
  for (const p of parts) {
    if (p === '..') out.pop();
    else if (p !== '.' && p !== '') out.push(p);
  }
  return out.join('/');
}

/**
 * Renders a page into sections split on h2. Code blocks with a `title="..."` are pulled out of
 * the prose and shown as examples next to the section they belong to.
 */
export function renderPage(md: string, pagePath: string): { title: string; sections: Section[] } {
  let blockId = 0;
  const marked = new Marked({ gfm: true });
  marked.use({
    renderer: {
      heading({ tokens, depth }) {
        const text = this.parser.parseInline(tokens);
        const id = slugify(text);
        return `<h${depth} id="${id}"><a class="anchor" href="${fileToRoute(pagePath).slice(1)}#${id}" data-anchor="${id}">#</a>${text}</h${depth}>`;
      },
      code({ text, lang }) {
        const { lang: l } = parseInfo(lang);
        const id = blockId++;
        return (
          `<div class="code"><div class="code-bar"><span>${escapeHtml(l || 'text')}</span>` +
          `<button type="button" class="copy" data-copy-block="${id}">Copy</button></div>` +
          `<pre><code data-block="${id}">${highlight(text, l)}</code></pre></div>`
        );
      },
      codespan({ text }) {
        const m = text.match(new RegExp(`^(${METHODS.join('|')})\\s+(\\S+)$`));
        if (m) {
          return `<span class="endpoint"><span class="method m-${m[1].toLowerCase()}">${m[1]}</span><code>${m[2]}</code></span>`;
        }
        return `<code>${text}</code>`;
      },
      link({ href, title, tokens }) {
        const text = this.parser.parseInline(tokens);
        const t = title ? ` title="${escapeHtml(title)}"` : '';
        if (/^[a-z]+:/i.test(href)) return `<a href="${href}"${t} target="_blank" rel="noopener">${text}</a>`;
        if (href.startsWith('#')) return `<a href="${fileToRoute(pagePath).slice(1)}${href}" data-anchor="${href.slice(1)}"${t}>${text}</a>`;
        const [file, hash] = href.split('#');
        const target = resolve(pagePath, file);
        return `<a href="${fileToRoute(target).slice(1) || './'}${hash ? `#${hash}` : ''}" data-page="${target}"${hash ? ` data-hash="${hash}"` : ''}${t}>${text}</a>`;
      },
    },
  });

  const tokens = marked.lexer(md);
  let title = '';
  const groups: { id: string; tokens: Token[]; examples: Example[] }[] = [
    { id: 'intro', tokens: [], examples: [] },
  ];

  for (const tok of tokens) {
    if (tok.type === 'heading' && (tok as Tokens.Heading).depth === 1 && !title) {
      title = (tok as Tokens.Heading).text;
      continue;
    }
    if (tok.type === 'heading' && (tok as Tokens.Heading).depth === 2) {
      groups.push({ id: slugify((tok as Tokens.Heading).text), tokens: [tok], examples: [] });
      continue;
    }
    const g = groups[groups.length - 1];
    if (tok.type === 'code') {
      const c = tok as Tokens.Code;
      const { lang, title: exTitle } = parseInfo(c.lang);
      if (exTitle) {
        g.examples.push({ title: exTitle, lang, code: c.text });
        continue;
      }
    }
    g.tokens.push(tok);
  }

  const sections = groups
    .filter((g) => g.tokens.length || g.examples.length)
    .map((g) => {
      const list = Object.assign(g.tokens, { links: (tokens as any).links ?? {} });
      return { id: g.id, html: marked.parser(list), examples: g.examples };
    });

  return { title, sections };
}
