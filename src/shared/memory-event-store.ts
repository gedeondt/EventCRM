import type { AppendDirective, ProjectionDirective, EventStore } from './event-store.js';

// In-memory collections for events and projections
const events: Record<string, any>[] = [];
const projections: Record<string, any>[] = [];

// Subscribers just like in the DynamoDB implementation
const subscribers: Record<string, ((event: any) => Promise<AppendDirective | void> | AppendDirective | void)[]> = {};
const projectionSubscribers: Record<string, ((event: any) => Promise<ProjectionDirective | void> | ProjectionDirective | void)[]> = {};

function logUndefinedPaths(obj: any, path: string[] = []) {
  if (Array.isArray(obj)) {
    obj.forEach((v, i) => logUndefinedPaths(v, [...path, String(i)]));
  } else if (obj && typeof obj === 'object') {
    for (const [key, value] of Object.entries(obj)) {
      if (value === undefined) {
        console.warn(`[undefined] ${[...path, key].join('.')}`);
      } else {
        logUndefinedPaths(value, [...path, key]);
      }
    }
  }
}

function assertNoUndefined(obj: any, path: string[] = []) {
  if (Array.isArray(obj)) {
    obj.forEach((v, i) => assertNoUndefined(v, [...path, String(i)]));
  } else if (obj && typeof obj === 'object') {
    for (const [key, value] of Object.entries(obj)) {
      if (value === undefined) {
        const fullPath = [...path, key].join('.');
        console.error(`[error] Undefined value at: ${fullPath}`);
        throw new Error(`Cannot persist event: undefined at ${fullPath}`);
      } else {
        assertNoUndefined(value, [...path, key]);
      }
    }
  }
}

export async function getEventsForAggregate(aggregateType: string, aggregateId: string): Promise<any[]> {
  const pk = `${aggregateType}#${aggregateId}`;
  return events.filter((e) => e.PK === pk).sort((a, b) => a.SK.localeCompare(b.SK));
}

export async function getEventsByPrefix(prefix: string): Promise<any[]> {
  return events.filter((e) => (e.PK as string).startsWith(prefix));
}

export async function getProjection(aggregateType: string, aggregateId: string, name: string): Promise<any | null> {
  const pk = `${aggregateType}#${aggregateId}`;
  const item = projections.find((p) => p.PK === pk && p.SK === name);
  return item || null;
}

export function subscribe(eventType: string, sub: (event: any) => Promise<AppendDirective | void> | AppendDirective | void) {
  if (!subscribers[eventType]) subscribers[eventType] = [];
  subscribers[eventType].push(sub);
}

export function subscribeProjection(eventType: string, sub: (event: any) => Promise<ProjectionDirective | void> | ProjectionDirective | void) {
  if (!projectionSubscribers[eventType]) projectionSubscribers[eventType] = [];
  projectionSubscribers[eventType].push(sub);
}

async function writeProjection(d: ProjectionDirective) {
  const item = { PK: `${d.aggregateType}#${d.aggregateId}`, SK: d.name, ...d.projection };
  const idx = projections.findIndex((p) => p.PK === item.PK && p.SK === item.SK);
  if (idx >= 0) projections[idx] = item; else projections.push(item);
}

async function handleProjections(event: any) {
  const subs = projectionSubscribers[event.type] || [];
  for (const s of subs) {
    const res = await Promise.resolve(s(event));
    if (res && 'projection' in res) {
      await writeProjection(res);
    }
  }
}

export async function appendEvent(event: any, aggregateType: string, aggregateId: string, version: number) {
  const base = { PK: `${aggregateType}#${aggregateId}`, SK: `v${String(version).padStart(10, '0')}`, ...event };

  const directives = await Promise.all((subscribers[event.type] || []).map((s) => Promise.resolve(s(event))));

  if (directives.some((d) => d && 'cancel' in d && d.cancel)) {
    return;
  }

  const items = [base];
  for (const d of directives) {
    if (d && 'event' in d) {
      items.push({ PK: `${d.aggregateType}#${d.aggregateId}`, SK: `v${String(d.version).padStart(10, '0')}`, ...d.event });
    }
  }

  for (const itm of items) {
    logUndefinedPaths(itm);
    assertNoUndefined(itm);
    events.push(itm);
  }

  const evs = [event, ...directives.filter((d) => d && 'event' in d).map((d: any) => d.event)];
  for (const ev of evs) {
    await handleProjections(ev);
  }
}

export const memoryEventStore: EventStore = {
  appendEvent,
  getEventsForAggregate,
  getEventsByPrefix,
  getProjection,
  subscribe,
  subscribeProjection
};
