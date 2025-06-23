export class Power {
  readonly value: number;
  constructor(value: number) {
    if (!value || value <= 0) {
      throw new Error('power must be greater than 0');
    }
    this.value = value;
  }
}
