import { Component, computed, inject, input, signal } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Clipboard } from './clipboard';
import { Example, highlight } from './markdown';

@Component({
  selector: 'app-examples',
  template: `
    <div class="panel">
      <div class="tabs" role="tablist">
        @for (ex of examples(); track $index) {
          <button
            type="button"
            role="tab"
            [class.active]="$index === active()"
            [attr.aria-selected]="$index === active()"
            (click)="active.set($index)"
          >
            {{ ex.title }}
          </button>
        }
      </div>
      <div class="bar">
        <span class="lang">{{ current().lang || 'text' }}</span>
        <button type="button" class="copy" (click)="clip.copy(current().code)">Copy</button>
      </div>
      <pre><code [innerHTML]="html()"></code></pre>
    </div>
  `,
  styles: `
    .panel {
      background: var(--code-bg);
      border: 1px solid var(--code-border);
      border-radius: 10px;
      overflow: hidden;
    }
    .tabs {
      display: flex;
      flex-wrap: wrap;
      gap: 2px;
      padding: 6px 6px 0;
      border-bottom: 1px solid var(--code-border);
    }
    .tabs button {
      font: inherit;
      font-size: 12.5px;
      color: var(--code-muted);
      background: none;
      border: 0;
      border-bottom: 2px solid transparent;
      padding: 7px 10px;
      cursor: pointer;
    }
    .tabs button.active {
      color: var(--code-fg);
      border-bottom-color: var(--accent);
    }
    .bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 12px;
      font-size: 12px;
      color: var(--code-muted);
    }
    pre {
      margin: 0;
      padding: 4px 14px 14px;
      max-height: 70vh;
      overflow: auto;
      color: var(--code-fg);
      font-size: 12.5px;
      line-height: 1.55;
    }
  `,
})
export class Examples {
  readonly examples = input.required<Example[]>();
  readonly active = signal(0);
  readonly current = computed(() => this.examples()[Math.min(this.active(), this.examples().length - 1)]);
  readonly html = computed(() => {
    const c = this.current();
    return this.sanitizer.bypassSecurityTrustHtml(highlight(c.code, c.lang));
  });
  protected readonly clip = inject(Clipboard);
  private readonly sanitizer = inject(DomSanitizer);
}
