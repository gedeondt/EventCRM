import express from 'express';
import { eventStore } from './shared/event-store.js';
import { ClientSlice } from './slices/client/index.js';
import { ContactSlice } from './slices/contact/index.js';

const app = express();
app.use(express.json());

const router = express.Router();
app.use('/api', router);

new ContactSlice(router, eventStore);
new ClientSlice(router, eventStore);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`CRM service running on http://localhost:${PORT}`);
});
