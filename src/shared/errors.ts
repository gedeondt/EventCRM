export class EventStoreConflictError extends Error {
  constructor(message: string = 'Event already exists') {
    super(message);
    this.name = 'EventStoreConflictError';
  }
}
