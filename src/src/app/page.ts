import { Component, ElementRef, computed, effect, inject, resource } from '@angular/core';
import { DomSanitizer, Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { NavigationEnd } from '@angular/router';
import { Clipboard } from './clipboard';
import { DocsService, toPlainMarkdown } from './docs.service';
import { Examples } from './examples';
import { renderPage } from './markdown';

@Component({
  selector: 'app-page',
  imports: [Examples],
  template: `
    @if (page.error()) {
      <div class="state">
        <h1>Page not found</h1>
        <p>Could not load <code>{{ path() }}</code>.</p>
      </div>
    } @else if (rendered(); as r) {
      <header class="page-head">
        <h1>{{ r.title }}</h1>
        <div class="actions">
          <button type="button" class="btn primary" (click)="copyForAgent()">Copy page for agent</button>
          <button type="button" class="btn" (click)="clip.copy(page.value()!, 'Raw markdown copied')">
            Copy raw markdown
          </button>
          <a class="btn" [href]="docs.rawUrl(path())" target="_blank" rel="noopener">View .md</a>
        </div>
      </header>
      <div class="sections" (click)="onClick($event)">
        @for (s of r.sections; track s.id + $index) {
          <section [class.has-examples]="s.examples.length">
            <div class="prose" [innerHTML]="s.html"></div>
            @if (s.examples.length) {
              <aside class="examples"><app-examples [examples]="s.examples" /></aside>
            }
          </section>
        }
      </div>
    } @else {
      <div class="state muted">Loading…</div>
    }
  `,
  styles: `
    :host {
      display: block;
    }
    .page-head {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px 24px;
      padding-bottom: 20px;
      margin-bottom: 8px;
      border-bottom: 1px solid var(--border);
    }
    .page-head h1 {
      margin: 0;
      font-size: 30px;
      letter-spacing: -0.02em;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    section {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: 28px;
      padding: 8px 0 16px;
    }
    @media (min-width: 1180px) {
      section.has-examples {
        grid-template-columns: minmax(0, 1fr) minmax(0, 0.95fr);
      }
      .examples {
        position: sticky;
        top: 20px;
        align-self: start;
        padding-top: 18px;
      }
    }
    .state {
      padding: 40px 0;
    }
    .muted {
      color: var(--muted);
    }
  `,
})
export class Page {
  protected readonly docs = inject(DocsService);
  protected readonly clip = inject(Clipboard);
  private readonly router = inject(Router);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly title = inject(Title);

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => this.router.url),
      startWith(this.router.url),
    ),
    { requireSync: true },
  );

  readonly path = computed(() => {
    const p = decodeURIComponent(this.url().split(/[?#]/)[0].replace(/^\/+/, ''));
    return p || 'README.md';
  });

  readonly page = resource({
    params: () => this.path(),
    loader: ({ params }) => this.docs.raw(params),
  });

  readonly rendered = computed(() => {
    const md = this.page.value();
    if (md === undefined) return null;
    const r = renderPage(toPlainMarkdown(md), this.path());
    return {
      title: r.title,
      sections: r.sections.map((s) => ({ ...s, html: this.sanitizer.bypassSecurityTrustHtml(s.html) })),
    };
  });

  constructor() {
    effect(() => {
      const r = this.rendered();
      if (!r) return;
      this.title.setTitle(`${r.title} · ${this.docs.siteTitle()}`);
      const hash = history.state?.anchor as string | undefined;
      queueMicrotask(() => {
        if (hash) this.scrollTo(hash);
        else window.scrollTo({ top: 0 });
      });
    });
  }

  copyForAgent() {
    this.clip.copy(this.docs.agentPage(this.path()), 'Page copied — paste it into your agent');
  }

  onClick(ev: MouseEvent) {
    const el = ev.target as HTMLElement;
    const copyBtn = el.closest<HTMLElement>('[data-copy-block]');
    if (copyBtn) {
      const code = this.host.nativeElement.querySelector(`code[data-block="${copyBtn.dataset['copyBlock']}"]`);
      this.clip.copy(code?.textContent ?? '');
      return;
    }
    const a = el.closest<HTMLAnchorElement>('a');
    if (!a || ev.metaKey || ev.ctrlKey || ev.shiftKey) return;
    if (a.dataset['anchor']) {
      ev.preventDefault();
      this.scrollTo(a.dataset['anchor']);
    } else if (a.dataset['page']) {
      ev.preventDefault();
      this.router.navigateByUrl('/' + a.dataset['page'], { state: { anchor: a.dataset['hash'] } });
    }
  }

  private scrollTo(id: string) {
    this.host.nativeElement.querySelector(`[id="${CSS.escape(id)}"]`)?.scrollIntoView({ behavior: 'smooth' });
  }
}
