import type { EventStoreAdapter } from './event-store-adapter.js';

export class MemoryAdapter implements EventStoreAdapter {
  private events: Record<string, any>[] = [];
  private projections: Record<string, any>[] = [];

  async queryEvents(pk: string): Promise<any[]> {
    return this.events
      .filter((e) => e.PK === pk)
      .sort((a, b) => (a.SK as string).localeCompare(b.SK as string));
  }

  async scanEvents(prefix: string): Promise<any[]> {
    return this.events.filter((e) => (e.PK as string).startsWith(prefix));
  }

  async getProjection(pk: string, name: string): Promise<any | null> {
    return this.projections.find((p) => p.PK === pk && p.SK === name) || null;
  }

  async putProjection(item: any): Promise<void> {
    const idx = this.projections.findIndex((p) => p.PK === item.PK && p.SK === item.SK);
    if (idx >= 0) this.projections[idx] = item; else this.projections.push(item);
  }

  async transactWriteEvents(items: any[]): Promise<void> {
    for (const it of items) {
      if (this.events.some((e) => e.PK === it.PK && e.SK === it.SK)) {
        throw new Error('Item already exists');
      }
    }
    this.events.push(...items);
  }

  async batchWriteEvents(items: any[]): Promise<void> {
    for (const it of items) {
      const idx = this.events.findIndex((e) => e.PK === it.PK && e.SK === it.SK);
      if (idx >= 0) this.events[idx] = it; else this.events.push(it);
    }
  }
}
