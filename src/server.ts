import express from 'express';
import { EventStore } from './shared/event-store.js';
import { DynamoDBAdapter } from './shared/adapters/dynamo-adapter.js';
import { MemoryAdapter } from './shared/adapters/memory-adapter.js';
import { ClientAggregate } from './aggregates/client/index.js';
import { ContactAggregate } from './aggregates/contact/index.js';
import { CaseAggregate } from './aggregates/case/index.js';
import { ContractAggregate } from './aggregates/contract/index.js';

const app = express();
app.use(express.json());

const router = express.Router();
app.use('/api', router);

const adapter = process.env.EVENT_STORE_ADAPTER === 'memory'
  ? new MemoryAdapter()
  : new DynamoDBAdapter();
const store = new EventStore(adapter);

new ContactAggregate(router, store);
new ClientAggregate(router, store);
new CaseAggregate(router, store);
new ContractAggregate(router, store);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`CRM service running on http://localhost:${PORT}`);
});
