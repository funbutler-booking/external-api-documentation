import { Injectable, signal } from '@angular/core';

export interface NavItem {
  title: string;
  path: string; // relative to docs/, e.g. "endpoints/bookings.md"
  group: string | null;
}

const DOCS_BASE = 'docs/';

/**
 * Loads markdown straight from the statically hosted docs/ folder.
 * Navigation is driven by GitBook's SUMMARY.md, so there is a single source of truth.
 */
@Injectable({ providedIn: 'root' })
export class DocsService {
  readonly nav = signal<NavItem[]>([]);
  readonly siteTitle = signal('API Documentation');
  private cache = new Map<string, Promise<string>>();

  async init(): Promise<void> {
    const [summary, readme] = await Promise.all([
      this.raw('SUMMARY.md'),
      this.raw('README.md').catch(() => ''),
    ]);
    this.nav.set(parseSummary(summary));
    const h1 = readme.match(/^#\s+(.+)$/m);
    if (h1) this.siteTitle.set(h1[1].trim());
  }

  raw(path: string): Promise<string> {
    if (!this.cache.has(path)) {
      const p = fetch(DOCS_BASE + path).then((r) => {
        if (!r.ok) throw new Error(`${r.status} ${path}`);
        return r.text();
      });
      p.catch(() => this.cache.delete(path));
      this.cache.set(path, p);
    }
    return this.cache.get(path)!;
  }

  rawUrl(path: string): string {
    return new URL(DOCS_BASE + path, document.baseURI).href;
  }

  /** One page, converted to plain markdown and labelled with its source, ready to paste into an agent. */
  async agentPage(path: string): Promise<string> {
    const md = toPlainMarkdown(await this.raw(path));
    return `<!-- Source: ${this.rawUrl(path)} -->\n\n${md.trim()}\n`;
  }

  /** Every page in SUMMARY order as one markdown bundle. */
  async agentBundle(): Promise<string> {
    const pages = await Promise.all(this.nav().map((n) => this.agentPage(n.path).catch(() => '')));
    const header =
      `# ${this.siteTitle()} — full integration reference\n\n` +
      `This bundle contains every page of the API documentation, including example requests, ` +
      `responses and webhook payloads. Use it as the source of truth when writing integration code.\n`;
    return [header, ...pages.filter(Boolean)].join('\n---\n\n');
  }
}

export function parseSummary(md: string): NavItem[] {
  const items: NavItem[] = [];
  let group: string | null = null;
  for (const line of md.split('\n')) {
    const h = line.match(/^##\s+(.+)$/);
    if (h) {
      group = h[1].trim();
      continue;
    }
    const l = line.match(/^\s*[*-]\s+\[([^\]]+)\]\(([^)]+)\)/);
    if (l) items.push({ title: l[1], path: l[2].replace(/^\.\//, ''), group });
  }
  return items;
}

/**
 * Converts GitBook-specific `{% ... %}` blocks into plain markdown so both the viewer and
 * agents can read them:
 *   {% code title="Response 200" %} ```json ... ``` {% endcode %}  ->  ```json title="Response 200"
 *   {% hint style="info" %} ... {% endhint %}                         ->  > **Info:** ...
 */
export function toPlainMarkdown(md: string): string {
  return md
    .replace(
      /\{%\s*code\s+([^%]*?)%\}\s*\n(\s*)(```+)([^\n]*)\n([\s\S]*?)\n\s*\3\s*\n\s*\{%\s*endcode\s*%\}/g,
      (_m, attrs: string, indent: string, fence: string, info: string, body: string) => {
        const title = attrs.match(/title="([^"]*)"/)?.[1];
        const lang = info.trim();
        return `${indent}${fence}${lang}${title ? ` title="${title}"` : ''}\n${body}\n${indent}${fence}`;
      },
    )
    .replace(
      /\{%\s*hint\s+style="(\w+)"\s*%\}\s*\n?([\s\S]*?)\n?\s*\{%\s*endhint\s*%\}/g,
      (_m, style: string, body: string) => {
        const label = style.charAt(0).toUpperCase() + style.slice(1);
        const lines = body.trim().split('\n');
        lines[0] = `**${label}:** ${lines[0]}`;
        return lines.map((l) => `> ${l}`).join('\n');
      },
    )
    .replace(/\{%[^%]*%\}\n?/g, '');
}

/** Doc file -> URL path: "endpoints/bookings.md" -> "/endpoints/bookings", "README.md" -> "/". */
export function fileToRoute(file: string): string {
  return '/' + file.replace(/(^|\/)README\.md$/i, '$1').replace(/\.md$/i, '');
}

/** URL -> doc file, the inverse of fileToRoute. */
export function routeToFile(url: string): string {
  const p = decodeURIComponent(url.split(/[?#]/)[0]).replace(/^\/+/, '');
  if (!p || p.endsWith('/')) return p + 'README.md';
  return /\.md$/i.test(p) ? p : p + '.md';
}
