import {
    ApplicationConfig,
    inject,
    provideAppInitializer,
    provideBrowserGlobalErrorListeners,
    provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { DocsService } from './docs.service';
import { Page } from './page';

export const appConfig: ApplicationConfig = {
    providers: [
        provideBrowserGlobalErrorListeners(),
        provideZonelessChangeDetection(),
        // Path routing: the host must serve index.html for unknown paths (SPA fallback), see README.
        provideRouter([{ path: '**', component: Page }]),
        provideAppInitializer(() => inject(DocsService).init()),
    ],
};
