import { Router } from 'express';
import type { EventStore } from './event-store.js';

/** Marker interface for slice classes */
export interface Slice {
  // Slices configure routes and subscriptions when instantiated
}

export type SliceConstructor = new (router: Router, eventStore: EventStore) => Slice;
