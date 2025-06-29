import { Router } from 'express';
import type { EventStore } from '../../shared/event-store.js';
import type { Aggregate } from '../../shared/aggregate.js';
import { registerCreateClientRoutes } from './create-client/http.js';
import { registerEditClientRoutes } from './edit-client/http.js';
import { registerLinkContactRoutes } from './link-contact/http.js';
import { registerUnlinkContactRoutes } from './unlink-contact/http.js';
import { registerGetClientRoutes } from './get-client/http.js';
import { registerUnlinkOnContactDeleted } from './unlink-contact/subscription.js';
import { registerAddDebtRoutes } from './add-debt/http.js';
import { registerPayDebtRoutes } from './pay-debt/http.js';

export class ClientAggregate implements Aggregate {
  constructor(router: Router, eventStore: EventStore) {
    registerCreateClientRoutes(router, eventStore);
    registerEditClientRoutes(router, eventStore);
    registerLinkContactRoutes(router, eventStore);
    registerUnlinkContactRoutes(router, eventStore);
    registerGetClientRoutes(router, eventStore);
    registerAddDebtRoutes(router, eventStore);
    registerPayDebtRoutes(router, eventStore);
    registerUnlinkOnContactDeleted(eventStore);
  }
}
