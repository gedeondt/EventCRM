import { Router } from 'express';
import type { EventStore } from '../../shared/event-store.js';
import type { Aggregate } from '../../shared/aggregate.js';
import { registerCreateContractRoutes } from './create-contract/http.js';
import { registerAddVersionRoutes } from './add-version/http.js';
import { registerGetContractRoutes } from './get-contract/http.js';
import { registerChangeHolderRoutes } from './change-holder/http.js';

export class ContractAggregate implements Aggregate {
  constructor(router: Router, eventStore: EventStore) {
    registerCreateContractRoutes(router, eventStore);
    registerAddVersionRoutes(router, eventStore);
    registerChangeHolderRoutes(router, eventStore);
    registerGetContractRoutes(router, eventStore);
  }
}
