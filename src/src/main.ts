import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { fileToRoute } from './app/docs.service';

// Keep old hash links working: /#/endpoints/bookings.md -> /endpoints/bookings
if (location.hash.startsWith('#/')) {
  const [file, anchor] = location.hash.slice(2).split('#');
  history.replaceState(null, '', fileToRoute(file).slice(1) + (anchor ? '#' + anchor : '') || './');
}

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
