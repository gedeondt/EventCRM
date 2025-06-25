import express from 'express';
import { eventStore as dynamoEventStore } from './shared/event-store.js';
import { memoryEventStore } from './shared/memory-event-store.js';
import { ClientAggregate } from './aggregates/client/index.js';
import { ContactAggregate } from './aggregates/contact/index.js';
import { CaseAggregate } from './aggregates/case/index.js';
import { ContractAggregate } from './aggregates/contract/index.js';

const app = express();
app.use(express.json());

const router = express.Router();
app.use('/api', router);

const store = process.env.EVENT_STORE_ADAPTER === 'memory'
  ? memoryEventStore
  : dynamoEventStore;

new ContactAggregate(router, store);
new ClientAggregate(router, store);
new CaseAggregate(router, store);
new ContractAggregate(router, store);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`CRM service running on http://localhost:${PORT}`);
});
