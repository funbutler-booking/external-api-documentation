import { Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { Clipboard } from './clipboard';
import { DocsService, NavItem, fileToRoute, routeToFile } from './docs.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink],
  template: `
    <div class="layout" [class.nav-open]="navOpen()">
      <aside class="sidebar">
        <div class="brand">
          <a routerLink="/" (click)="navOpen.set(false)">{{ docs.siteTitle() }}</a>
        </div>
        <input
          class="search"
          type="search"
          placeholder="Filter pages…"
          [value]="query()"
          (input)="query.set($any($event.target).value)"
        />
        <nav>
          @for (g of groups(); track g.name) {
            @if (g.name) {
              <div class="group">{{ g.name }}</div>
            }
            @for (item of g.items; track item.path) {
              <a
                [routerLink]="route(item.path)"
                [class.active]="item.path === activePath()"
                (click)="navOpen.set(false)"
                >{{ item.title }}</a
              >
            }
          }
        </nav>
        <div class="agent-box">
          <strong>Building with an AI agent?</strong>
          <p>Copy every page, with examples, as one markdown bundle.</p>
          <button type="button" class="btn primary block" (click)="copyAll()">Copy all docs for agent</button>
        </div>
      </aside>
      <div class="scrim" (click)="navOpen.set(false)"></div>
      <main>
        <div class="topbar">
          <button type="button" class="btn" (click)="navOpen.set(true)" aria-label="Open navigation">☰ Menu</button>
        </div>
        <div class="content"><router-outlet /></div>
      </main>
    </div>
    @if (clip.toast(); as t) {
      <div class="toast" role="status">{{ t }}</div>
    }
  `,
})
export class App {
  protected readonly docs = inject(DocsService);
  protected readonly clip = inject(Clipboard);
  private readonly router = inject(Router);

  protected readonly route = fileToRoute;
  readonly query = signal('');
  readonly navOpen = signal(false);

  readonly activePath = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      startWith(null),
      map(() => routeToFile(this.router.url)),
    ),
    { initialValue: 'README.md' },
  );

  readonly groups = computed(() => {
    const q = this.query().trim().toLowerCase();
    const out: { name: string | null; items: NavItem[] }[] = [];
    for (const item of this.docs.nav()) {
      if (q && !`${item.title} ${item.group ?? ''}`.toLowerCase().includes(q)) continue;
      let g = out[out.length - 1];
      if (!g || g.name !== item.group) out.push((g = { name: item.group, items: [] }));
      g.items.push(item);
    }
    return out;
  });

  copyAll() {
    this.clip.copy(this.docs.agentBundle(), 'All docs copied — paste them into your agent');
  }
}
