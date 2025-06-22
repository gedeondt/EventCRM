import { Router } from 'express';
import type { EventStore } from '../../shared/event-store.js';
import type { Slice } from '../../shared/slice.js';
import { registerCreateClientRoutes } from './create-client/http.js';
import { registerEditClientRoutes } from './edit-client/http.js';
import { registerLinkContactRoutes } from './link-contact/http.js';
import { registerUnlinkContactRoutes } from './unlink-contact/http.js';
import { registerProjectClientRoutes } from './project-client/http.js';
import { registerUnlinkOnContactDeleted } from './unlink-contact/subscription.js';

export class ClientSlice implements Slice {
  constructor(router: Router, eventStore: EventStore) {
    registerCreateClientRoutes(router, eventStore);
    registerEditClientRoutes(router, eventStore);
    registerLinkContactRoutes(router, eventStore);
    registerUnlinkContactRoutes(router, eventStore);
    registerProjectClientRoutes(router, eventStore);
    registerUnlinkOnContactDeleted(eventStore);
  }
}
