export class Tariff {
  readonly value: string;
  constructor(value: string) {
    if (!value || value.trim().length < 3) {
      throw new Error('tariff must be at least 3 characters');
    }
    this.value = value;
  }
}
