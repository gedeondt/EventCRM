# EventCRM

This project explores building a CRM using **Event Sourcing** in Node.js. The codebase follows a _feature-oriented_ approach with **vertical slices**, meaning each use case lives in its own directory with the commands, events and HTTP routes that belong to it.

## Goals

- Model CRM entities (contacts and clients) as aggregates whose changes are represented by immutable events.
- Allow the system to grow by adding new slices within each aggregate without affecting the rest of the code.
- Provide traceability for every operation through a `TraceContext` carried inside the events.

## Structure

```
src/
├─ server.ts          # Express service entrypoint
├─ shared/            # Common utilities (event-store, trace)
├─ scripts/           # Utilities such as the data generator
└─ aggregates/
   ├─ contact/
   │  ├─ create-contact/
   │  ├─ edit-contact/
   │  ├─ delete-contact/
   │  ├─ get-contact/
   │  └─ project-contact.ts
   ├─ client/
   │  ├─ create-client/
   │  ├─ edit-client/
   │  ├─ link-contact/
   │  ├─ unlink-contact/
   │  ├─ get-client/
   │  └─ project-client.ts
   └─ case/
      ├─ create-case/
      ├─ add-interaction/
      ├─ close-case/
      ├─ get-case/
      ├─ open-cases/
      └─ project-case.ts
```

- **server.ts** registers each aggregate as an Express router.
- Inside `aggregates/` each aggregate is composed of slices implementing the command and event flow.

### Entities

The project models three core aggregates:

- **Contact** — `contactId`, `name`, `email` and `phone`.
- **Client** — `clientId`, `name` and `industry`.
- **Case** — `caseId`, `clientId`, `description`, `openedAt`, `closedAt` and a list of interactions.

## Event Store

Events are persisted in **DynamoDB**. The helper `appendEvent` controls the aggregate version and verifies that no `undefined` values are present before writing:

```ts
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  TransactWriteCommand
} from '@aws-sdk/lib-dynamodb';

// ...
export async function appendEvent(event: any, aggregateId: string, version: number) {
  const item = {
    PK: `contact#${aggregateId}`,
    SK: `v${String(version).padStart(10, '0')}`,
    ...event
  };
  // Subscribers may add more events or cancel
  await docClient.send(new TransactWriteCommand({
    TransactItems: [{ Put: { TableName: 'EventStore', Item: item } }]
  }));
}
```

The event store can run in **direct** mode (default) or in **batch** mode. Set `EVENT_STORE_MODE=batch` to buffer events locally and write them in bulk every 10 seconds. Reads always come from DynamoDB.

Slices can **subscribe** to specific event types:

```ts
subscribe('ContactDeleted', (evt) => {
  if (!evt.cascade) return { cancel: true };
  return { event: /* ... */, aggregateType: 'client', aggregateId: evt.clientId, version: 5 };
});
```

Slices may also subscribe to build **projections**. After an event has been
written, the store will notify projection subscribers which can return an object
to persist in the `ProjectionStore` table:

```ts
subscribeProjection('ClientCreated', (evt) => ({
  projection: { name: evt.name },
  aggregateType: 'client',
  aggregateId: evt.clientId,
  name: 'summary'
}));
```

_Infrastructure:_ the `infra/` folder contains Terraform definitions that create
both the `EventStore` and `ProjectionStore` tables with streams enabled for
future event subscriptions.

## Contact aggregate

The first slice implemented handles creating and editing contacts. Each command produces an event (`ContactCreated` or `ContactEdited`) that is then stored using `appendEvent`. Each operation now has its own folder with a dedicated `http.ts` file:

```ts
// 📌 POST /contacts → Create contact
router.post('/contacts', async (req, res) => { /* ... */ });

// 📌 PUT /contacts/:id → Edit contact
router.put('/contacts/:id', async (req, res) => { /* ... */ });

// 📌 DELETE /contacts/:id → Delete contact
router.delete('/contacts/:id', async (req, res) => { /* ... */ });

// 📌 GET /contacts/:id → Fetch contact details
router.get('/contacts/:id', async (req, res) => { /* ... */ });
```

## Client aggregate

The client aggregate keeps references to contacts. It provides endpoints for creation, editing and for linking or unlinking contacts:

```ts
// 📌 POST /clients → Create client
router.post('/clients', async (req, res) => { /* ... */ });

// 📌 POST /clients/:id/contacts → Link contact
router.post('/clients/:id/contacts', async (req, res) => { /* ... */ });

// 📌 DELETE /clients/:id/contacts/:contactId → Unlink contact
router.delete('/clients/:id/contacts/:contactId', async (req, res) => { /* ... */ });

// 📌 GET /clients/:id → Fetch client details
router.get('/clients/:id', async (req, res) => { /* ... */ });
```

## Case aggregate

Cases track interactions with a client. Each case can be opened, receive notes and be closed. The aggregate exposes the following routes:

```ts
// 📌 POST /cases → Create case
router.post('/cases', async (req, res) => { /* ... */ });

// 📌 POST /cases/:id/interactions → Add interaction
router.post('/cases/:id/interactions', async (req, res) => { /* ... */ });

// 📌 POST /cases/:id/close → Close case
router.post('/cases/:id/close', async (req, res) => { /* ... */ });

// 📌 GET /cases/:id → Fetch case details
router.get('/cases/:id', async (req, res) => { /* ... */ });

// 📌 GET /cases/open?clientId=... → List open cases
router.get('/cases/open', async (req, res) => { /* ... */ });
```

## Running

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Run `npm run dev:batch` to start in batch mode, which buffers events locally and
flushes them to DynamoDB every 10 seconds.

The service will be available at `http://localhost:3000` and exposes its endpoints under `/api`.

### Generating sample data

Use the seed script to create random clients, contacts and cases:

```bash
npm run seed -- 5
```

Set the `BASE_URL` environment variable to target a different instance.

## Testing

This project uses Node.js's built-in test runner which requires **Node.js v20 or newer**. When you run:

```bash
npm run test
```

the `test` script first compiles the TypeScript sources into the `dist/` folder and then executes `node --test` against the generated JavaScript files.

## Next steps

- Add new slices (for example, managing opportunities or tasks).
- Implement event projections and queries.
- Automate fetching and checking aggregate versions.
- Explore event subscriptions to coordinate aggregates.
