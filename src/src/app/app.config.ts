import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { DocsService } from './docs.service';
import { Page } from './page';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    // Hash routing: deep links work on any static host (S3, GitHub Pages, ...) without rewrite rules.
    provideRouter([{ path: '**', component: Page }], withHashLocation()),
    provideAppInitializer(() => inject(DocsService).init()),
  ],
};
