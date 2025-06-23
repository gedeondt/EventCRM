export type ContractState = {
  contractId: string;
  clientId?: string;
  versions: { startDate: string; tariff: string; power: number; cups: string; address: string }[];
  version: number;
};

export function projectContract(events: any[]): ContractState | null {
  if (!events.length) return null;

  const state: ContractState = {
    contractId: '',
    versions: [],
    version: 0
  };

  for (const event of events) {
    switch (event.type) {
      case 'ContractCreated':
        state.contractId = event.contractId;
        state.clientId = event.clientId;
        state.versions.push({
          startDate: event.startDate,
          tariff: event.tariff,
          power: event.power,
          cups: event.cups,
          address: event.address
        });
        state.version += 1;
        break;
      case 'ContractVersionAdded':
        state.versions.push({
          startDate: event.startDate,
          tariff: event.tariff,
          power: event.power,
          cups: event.cups,
          address: event.address
        });
        state.version += 1;
        break;
    }
  }

  return state;
}
