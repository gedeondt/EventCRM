export class Mail {
  readonly value: string;
  constructor(value: string) {
    if (!value || !value.includes('@')) {
      throw new Error('invalid email');
    }
    this.value = value;
  }
}
