import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class Clipboard {
  readonly toast = signal<string | null>(null);
  private timer: ReturnType<typeof setTimeout> | undefined;

  async copy(text: string | Promise<string>, message = 'Copied to clipboard'): Promise<void> {
    try {
      // Pass a promise to ClipboardItem where supported so Safari keeps the user gesture.
      if (typeof ClipboardItem !== 'undefined' && text instanceof Promise && navigator.clipboard?.write) {
        const blob = text.then((t) => new Blob([t], { type: 'text/plain' }));
        await navigator.clipboard.write([new ClipboardItem({ 'text/plain': blob })]);
      } else {
        await navigator.clipboard.writeText(await text);
      }
      this.show(message);
    } catch {
      this.show('Copy failed — your browser blocked clipboard access');
    }
  }

  private show(message: string) {
    this.toast.set(message);
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.toast.set(null), 2200);
  }
}
