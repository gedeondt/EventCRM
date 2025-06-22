import { projectCase, CaseState } from '../project-case/index.js';

export function projectOpenCases(events: any[], clientId?: string): CaseState[] {
  const byCase: Record<string, any[]> = {};

  for (const evt of events) {
    const id = evt.caseId;
    if (!id) continue;
    if (!byCase[id]) byCase[id] = [];
    byCase[id].push(evt);
  }

  const result: CaseState[] = [];
  for (const evts of Object.values(byCase)) {
    evts.sort((a, b) => (a.SK || '').localeCompare(b.SK || ''));
    const state = projectCase(evts);
    if (state && !state.closedAt && (!clientId || state.clientId === clientId)) {
      result.push(state);
    }
  }

  return result;
}
