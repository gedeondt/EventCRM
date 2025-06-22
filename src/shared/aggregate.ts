import { Router } from 'express';
import type { EventStore } from './event-store.js';

/** Marker interface for aggregate classes */
export interface Aggregate {
  // Aggregates configure routes and subscriptions when instantiated
}

export type AggregateConstructor = new (
  router: Router,
  eventStore: EventStore
) => Aggregate;
