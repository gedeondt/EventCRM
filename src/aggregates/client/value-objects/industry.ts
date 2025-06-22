export class Industry {
  readonly value: string;
  constructor(value: string) {
    if (!value || value.trim().length < 2) {
      throw new Error('industry must be at least 2 characters');
    }
    this.value = value;
  }
}
