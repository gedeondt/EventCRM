export interface EventStoreAdapter {
  queryEvents(pk: string): Promise<any[]>;
  scanEvents(prefix: string): Promise<any[]>;
  getProjection(pk: string, name: string): Promise<any | null>;
  putProjection(item: any): Promise<void>;
  transactWriteEvents(items: any[]): Promise<void>;
  batchWriteEvents(items: any[]): Promise<void>;
}
