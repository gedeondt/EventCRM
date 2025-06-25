import type { EventStoreAdapter } from './adapters/event-store-adapter.js';

export type AppendDirective =
  | { cancel: true }
  | {
      event: any;
      aggregateType: string;
      aggregateId: string;
      version: number;
    };

export type ProjectionDirective = {
  projection: any;
  aggregateType: string;
  aggregateId: string;
  name: string;
};

type ProjectionSubscriber = (
  event: any
) => Promise<ProjectionDirective | void> | ProjectionDirective | void;

type Subscriber = (event: any) => Promise<AppendDirective | void> | AppendDirective | void;

export class EventStore {
  private adapter: EventStoreAdapter;
  private subscribers: Record<string, Subscriber[]> = {};
  private projectionSubscribers: Record<string, ProjectionSubscriber[]> = {};
  private buffer: { item: Record<string, any>; event: any }[] = [];
  private mode: 'direct' | 'batch';

  constructor(adapter: EventStoreAdapter) {
    this.adapter = adapter;
    this.mode = (process.env.EVENT_STORE_MODE as 'direct' | 'batch') ?? 'direct';
    if (this.mode === 'batch') {
      setInterval(() => {
        this.flushBuffer().catch((err) => console.error('[flush error]', err));
      }, 10_000);
    }
  }

  private async flushBuffer() {
    if (this.buffer.length === 0) return;
    const items = this.buffer.splice(0, this.buffer.length);
    await this.adapter.batchWriteEvents(items.map((b) => b.item));
    for (const b of items) {
      await this.handleProjections(b.event);
    }
  }

  private logUndefinedPaths(obj: any, path: string[] = []) {
    if (Array.isArray(obj)) {
      obj.forEach((v, i) => this.logUndefinedPaths(v, [...path, String(i)]));
    } else if (obj && typeof obj === 'object') {
      for (const [key, value] of Object.entries(obj)) {
        if (value === undefined) {
          console.warn(`[undefined] ${[...path, key].join('.')}`);
        } else {
          this.logUndefinedPaths(value, [...path, key]);
        }
      }
    }
  }

  private assertNoUndefined(obj: any, path: string[] = []) {
    if (Array.isArray(obj)) {
      obj.forEach((v, i) => this.assertNoUndefined(v, [...path, String(i)]));
    } else if (obj && typeof obj === 'object') {
      for (const [key, value] of Object.entries(obj)) {
        if (value === undefined) {
          const fullPath = [...path, key].join('.');
          console.error(`[error] Undefined value at: ${fullPath}`);
          throw new Error(`Cannot persist event: undefined at ${fullPath}`);
        } else {
          this.assertNoUndefined(value, [...path, key]);
        }
      }
    }
  }

  async getEventsForAggregate(aggregateType: string, aggregateId: string): Promise<any[]> {
    const pk = `${aggregateType}#${aggregateId}`;
    return this.adapter.queryEvents(pk);
  }

  async getEventsByPrefix(prefix: string): Promise<any[]> {
    return this.adapter.scanEvents(prefix);
  }

  async getProjection(aggregateType: string, aggregateId: string, name: string): Promise<any | null> {
    const pk = `${aggregateType}#${aggregateId}`;
    return this.adapter.getProjection(pk, name);
  }

  subscribe(eventType: string, sub: Subscriber) {
    if (!this.subscribers[eventType]) this.subscribers[eventType] = [];
    this.subscribers[eventType].push(sub);
  }

  subscribeProjection(eventType: string, sub: ProjectionSubscriber) {
    if (!this.projectionSubscribers[eventType]) this.projectionSubscribers[eventType] = [];
    this.projectionSubscribers[eventType].push(sub);
  }

  private async writeProjection(d: ProjectionDirective) {
    const item = {
      PK: `${d.aggregateType}#${d.aggregateId}`,
      SK: d.name,
      ...d.projection
    };
    await this.adapter.putProjection(item);
  }

  private async handleProjections(event: any) {
    const subs = this.projectionSubscribers[event.type] || [];
    for (const s of subs) {
      const res = await Promise.resolve(s(event));
      if (res && 'projection' in res) {
        await this.writeProjection(res);
      }
    }
  }

  async appendEvent(event: any, aggregateType: string, aggregateId: string, version: number) {
    const base = {
      PK: `${aggregateType}#${aggregateId}`,
      SK: `v${String(version).padStart(10, '0')}`,
      ...event
    };

    const directives = await Promise.all(
      (this.subscribers[event.type] || []).map((s) => Promise.resolve(s(event)))
    );

    if (directives.some((d) => d && 'cancel' in d && d.cancel)) {
      return;
    }

    const items = [base];
    for (const d of directives) {
      if (d && 'event' in d) {
        items.push({
          PK: `${d.aggregateType}#${d.aggregateId}`,
          SK: `v${String(d.version).padStart(10, '0')}`,
          ...d.event
        });
      }
    }

    for (const itm of items) {
      this.logUndefinedPaths(itm);
      this.assertNoUndefined(itm);
    }

    const events = [event, ...directives.filter((d) => d && 'event' in d).map((d: any) => d.event)];

    if (this.mode === 'batch') {
      for (const itm of items) {
        this.buffer.push({ item: itm, event: events.shift() });
      }
      return;
    }

    await this.adapter.transactWriteEvents(items);
    for (const ev of events) {
      await this.handleProjections(ev);
    }
  }
}

export type { EventStoreAdapter } from './adapters/event-store-adapter.js';
