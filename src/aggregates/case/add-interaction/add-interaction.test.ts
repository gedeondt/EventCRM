import test from 'node:test';
import assert from 'node:assert/strict';
import { handleAddInteraction } from './index.js';
import { CaseId } from '../value-objects/case-id.js';
import { Description } from '../value-objects/description.js';

const trace = { traceId: 't', spanId: 's', timestamp: new Date().toISOString() };

test('valid command produces event', () => {
  const cmd = {
    caseId: new CaseId('1'),
    interactionDate: '2024-01-02',
    description: new Description('Called customer'),
    trace
  };
  const res = handleAddInteraction(cmd);
  assert.equal(res.ok, true);
  if (res.ok) {
    assert.equal(res.value.caseId, '1');
    assert.equal(res.value.interactionDate, '2024-01-02');
  }
});
