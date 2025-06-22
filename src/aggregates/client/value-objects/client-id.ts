export class ClientId {
  readonly value: string;
  constructor(value: string) {
    if (!value || value.trim() === '') {
      throw new Error('clientId is required');
    }
    this.value = value;
  }
}
