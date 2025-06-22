export class Phone {
  readonly value: string;
  constructor(value: string) {
    if (!value || value.trim().length < 7) {
      throw new Error('invalid phone');
    }
    this.value = value;
  }
}
