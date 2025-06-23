export class Cups {
  readonly value: string;
  constructor(value: string) {
    if (!value || value.trim().length < 5) {
      throw new Error('cups must be at least 5 characters');
    }
    this.value = value;
  }
}
