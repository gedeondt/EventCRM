import { Router } from 'express';
import type { EventStore } from '../../shared/event-store.js';
import type { Slice } from '../../shared/slice.js';
import { registerCreateContactRoutes } from './create-contact/http.js';
import { registerEditContactRoutes } from './edit-contact/http.js';
import { registerDeleteContactRoutes } from './delete-contact/http.js';
import { registerProjectContactRoutes } from './project-contact/http.js';

export class ContactSlice implements Slice {
  constructor(router: Router, eventStore: EventStore) {
    registerCreateContactRoutes(router, eventStore);
    registerEditContactRoutes(router, eventStore);
    registerDeleteContactRoutes(router, eventStore);
    registerProjectContactRoutes(router, eventStore);
  }
}
