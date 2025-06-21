export class Name {
  readonly value: string;
  constructor(value: string) {
    if (!value || value.trim().length < 2) {
      throw new Error('name must be at least 2 characters');
    }
    this.value = value;
  }
}
