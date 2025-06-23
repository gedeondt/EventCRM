export class Address {
  readonly value: string;
  constructor(value: string) {
    if (!value || value.trim().length < 5) {
      throw new Error('address must be at least 5 characters');
    }
    this.value = value;
  }
}
