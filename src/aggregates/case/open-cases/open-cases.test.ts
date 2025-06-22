import test from 'node:test';
import assert from 'node:assert/strict';
import { projectOpenCases } from './index.js';

const trace = { traceId: 't', spanId: 's', timestamp: new Date().toISOString() };

const case1Created = {
  type: 'CaseCreated',
  caseId: '1',
  clientId: 'c1',
  openedAt: '2024-01-01',
  description: 'Issue',
  trace,
  timestamp: new Date().toISOString()
};

const case1Closed = {
  type: 'CaseClosed',
  caseId: '1',
  closedAt: '2024-01-02',
  trace,
  timestamp: new Date().toISOString()
};

const case2Created = {
  type: 'CaseCreated',
  caseId: '2',
  clientId: 'c2',
  openedAt: '2024-01-03',
  description: 'Another',
  trace,
  timestamp: new Date().toISOString()
};

test('filters open cases', () => {
  const result = projectOpenCases([case1Created, case1Closed, case2Created]);
  assert.equal(result.length, 1);
  assert.equal(result[0].caseId, '2');
});

test('filters by clientId', () => {
  const result = projectOpenCases([case1Created, case2Created], 'c1');
  assert.equal(result.length, 1);
  assert.equal(result[0].clientId, 'c1');
});
