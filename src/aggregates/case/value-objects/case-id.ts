export class CaseId {
  readonly value: string;
  constructor(value: string) {
    if (!value || value.trim() === '') {
      throw new Error('caseId is required');
    }
    this.value = value;
  }
}
