import { Router } from 'express';
import type { EventStore } from '../../shared/event-store.js';
import type { Aggregate } from '../../shared/aggregate.js';
import { registerCreateCaseRoutes } from './create-case/http.js';
import { registerAddInteractionRoutes } from './add-interaction/http.js';
import { registerCloseCaseRoutes } from './close-case/http.js';
import { registerProjectCaseRoutes } from './project-case/http.js';
import { registerOpenCasesRoutes } from './open-cases/http.js';

export class CaseAggregate implements Aggregate {
  constructor(router: Router, eventStore: EventStore) {
    registerCreateCaseRoutes(router, eventStore);
    registerAddInteractionRoutes(router, eventStore);
    registerCloseCaseRoutes(router, eventStore);
    registerProjectCaseRoutes(router, eventStore);
    registerOpenCasesRoutes(router, eventStore);
  }
}
