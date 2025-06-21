export class ContactId {
  readonly value: string;
  constructor(value: string) {
    if (!value || value.trim() === '') {
      throw new Error('contactId is required');
    }
    this.value = value;
  }
}
