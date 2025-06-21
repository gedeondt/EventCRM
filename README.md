# EventCRM

This project explores building a CRM using **Event Sourcing** in Node.js. The codebase follows a _feature-oriented_ approach with **vertical slices**, meaning each feature lives in its own directory with the commands, events and HTTP routes that belong to it.

## Goals

- Model CRM entities (contacts and clients) as aggregates whose changes are represented by immutable events.
- Allow the system to grow by adding new slices without affecting the rest of the code.
- Provide traceability for every operation through a `TraceContext` carried inside the events.

## Structure

```
src/
├─ server.ts          # Express service entrypoint
├─ shared/            # Common utilities (event-store, trace)
└─ slices/
   └─ contact/
      ├─ create-contact/
      │  ├─ index.ts   # Command + event
      │  └─ http.ts    # REST endpoint for creation
      ├─ edit-contact/
      │  ├─ index.ts
      │  └─ http.ts    # Endpoint for editing
      └─ project-contact/
         ├─ index.ts   # Projection logic
         └─ http.ts    # Endpoint for fetching
   └─ client/
      ├─ create-client/
      ├─ edit-client/
      ├─ link-contact/
      ├─ unlink-contact/
      └─ project-client/
```

- **server.ts** registers each slice as an Express router.
- Inside `slices/` every file implements part of the command and event flow.

## Event Store

Events are persisted in **DynamoDB**. The helper `appendEvent` controls the aggregate version and verifies that no `undefined` values are present before writing:

```ts
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand
} from '@aws-sdk/lib-dynamodb';

// ...
export async function appendEvent(event: any, aggregateId: string, version: number) {
  const item = {
    PK: `contact#${aggregateId}`,
    SK: `v${String(version).padStart(10, '0')}`,
    ...event
  };
  // Validation and write to DynamoDB
}
```

_Infrastructure:_ the `infra/` folder contains Terraform definitions that create the `EventStore` table with streams enabled for future event subscriptions.

## Contact slice

The first slice implemented handles creating and editing contacts. Each command produces an event (`ContactCreated` or `ContactEdited`) that is then stored using `appendEvent`. Each operation now has its own folder with a dedicated `http.ts` file:

```ts
// 📌 POST /contacts → Create contact
router.post('/contacts', async (req, res) => { /* ... */ });

// 📌 PUT /contacts/:id → Edit contact
router.put('/contacts/:id', async (req, res) => { /* ... */ });
```

## Client slice

The client aggregate keeps references to contacts. It provides endpoints for creation, editing and for linking or unlinking contacts:

```ts
// 📌 POST /clients → Create client
router.post('/clients', async (req, res) => { /* ... */ });

// 📌 POST /clients/:id/contacts → Link contact
router.post('/clients/:id/contacts', async (req, res) => { /* ... */ });

// 📌 DELETE /clients/:id/contacts/:contactId → Unlink contact
router.delete('/clients/:id/contacts/:contactId', async (req, res) => { /* ... */ });
```

## Running

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

The service will be available at `http://localhost:3000` and exposes its endpoints under `/api`.

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
