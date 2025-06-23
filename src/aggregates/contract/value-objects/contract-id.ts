export class ContractId {
  readonly value: string;
  constructor(value: string) {
    if (!value || value.trim() === '') {
      throw new Error('contractId is required');
    }
    this.value = value;
  }
}
