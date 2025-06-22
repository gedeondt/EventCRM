import express from 'express';
import { eventStore } from './shared/event-store.js';
import { ClientAggregate } from './aggregates/client/index.js';
import { ContactAggregate } from './aggregates/contact/index.js';
import { CaseAggregate } from './aggregates/case/index.js';

const app = express();
app.use(express.json());

const router = express.Router();
app.use('/api', router);

new ContactAggregate(router, eventStore);
new ClientAggregate(router, eventStore);
new CaseAggregate(router, eventStore);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`CRM service running on http://localhost:${PORT}`);
});
