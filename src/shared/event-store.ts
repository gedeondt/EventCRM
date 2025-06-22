import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  ScanCommand,
  TransactWriteCommand,
  BatchWriteCommand
} from "@aws-sdk/lib-dynamodb";

const REGION = process.env.AWS_REGION || 'eu-west-1';

const client = new DynamoDBClient({ region: REGION });

export const docClient = DynamoDBDocumentClient.from(client);

const MODE = process.env.EVENT_STORE_MODE ?? 'direct';
const buffer: Record<string, any>[] = [];

async function flushBuffer() {
  if (buffer.length === 0) return;
  const items = buffer.splice(0, buffer.length);
  for (let i = 0; i < items.length; i += 25) {
    const batch = items.slice(i, i + 25).map((Item) => ({ PutRequest: { Item } }));
    let requestItems: Record<string, any> = { EventStore: batch };
    do {
      const res = await docClient.send(new BatchWriteCommand({ RequestItems: requestItems }));
      requestItems = res.UnprocessedItems && res.UnprocessedItems.EventStore?.length
        ? { EventStore: res.UnprocessedItems.EventStore }
        : undefined as any;
    } while (requestItems);
  }
}

if (MODE === 'batch') {
  setInterval(() => {
    flushBuffer().catch((err) => console.error('[flush error]', err));
  }, 10_000);
}

// 🔍 Detecta undefineds y loguea la ruta exacta
function logUndefinedPaths(obj: any, path: string[] = []) {
  if (Array.isArray(obj)) {
    obj.forEach((v, i) => logUndefinedPaths(v, [...path, String(i)]));
  } else if (obj && typeof obj === 'object') {
    for (const [key, value] of Object.entries(obj)) {
      if (value === undefined) {
        console.warn(`[undefined] ${[...path, key].join('.')}`);
      } else {
        logUndefinedPaths(value, [...path, key]);
      }
    }
  }
}

// 🚨 Falla si encuentra undefineds en objetos anidados
function assertNoUndefined(obj: any, path: string[] = []) {
  if (Array.isArray(obj)) {
    obj.forEach((v, i) => assertNoUndefined(v, [...path, String(i)]));
  } else if (obj && typeof obj === 'object') {
    for (const [key, value] of Object.entries(obj)) {
      if (value === undefined) {
        const fullPath = [...path, key].join('.');
        console.error(`[error] Undefined value at: ${fullPath}`);
        throw new Error(`Cannot persist event: undefined at ${fullPath}`);
      } else {
        assertNoUndefined(value, [...path, key]);
      }
    }
  }
}

export async function getEventsForAggregate(
  aggregateType: string,
  aggregateId: string
): Promise<any[]> {
  const pk = `${aggregateType}#${aggregateId}`;

  const result = await docClient.send(
    new QueryCommand({
      TableName: "EventStore",
      KeyConditionExpression: "PK = :pk",
      ExpressionAttributeValues: {
        ":pk": pk
      },
      ScanIndexForward: true
    })
  );

  return result.Items || [];
}

export async function getEventsByPrefix(prefix: string): Promise<any[]> {
  const items: any[] = [];
  let ExclusiveStartKey: Record<string, any> | undefined = undefined;

  do {
    const result = await docClient.send(
      new ScanCommand({
        TableName: "EventStore",
        FilterExpression: "begins_with(PK, :pk)",
        ExpressionAttributeValues: {
          ":pk": prefix
        },
        ExclusiveStartKey
      })
    );

    if (result.Items) items.push(...result.Items);
    ExclusiveStartKey = result.LastEvaluatedKey as Record<string, any> | undefined;
  } while (ExclusiveStartKey);

  return items;
}

export type AppendDirective =
  | { cancel: true }
  | {
      event: any;
      aggregateType: string;
      aggregateId: string;
      version: number;
    };

type Subscriber = (event: any) => Promise<AppendDirective | void> | AppendDirective | void;

const subscribers: Record<string, Subscriber[]> = {};

export function subscribe(eventType: string, sub: Subscriber) {
  if (!subscribers[eventType]) subscribers[eventType] = [];
  subscribers[eventType].push(sub);
}

export async function appendEvent(
  event: any,
  aggregateType: string,
  aggregateId: string,
  version: number
) {
  const base = {
    PK: `${aggregateType}#${aggregateId}`,
    SK: `v${String(version).padStart(10, "0")}`,
    ...event
  };

  const directives = await Promise.all(
    (subscribers[event.type] || []).map((s) => Promise.resolve(s(event)))
  );

  if (directives.some((d) => d && "cancel" in d && d.cancel)) {
    return;
  }

  const items = [base];

  for (const d of directives) {
    if (d && "event" in d) {
      items.push({
        PK: `${d.aggregateType}#${d.aggregateId}`,
        SK: `v${String(d.version).padStart(10, "0")}`,
        ...d.event
      });
    }
  }

  for (const itm of items) {
    logUndefinedPaths(itm);
    assertNoUndefined(itm);
  }

  const transactItems = items.map((itm) => ({
    Put: {
      TableName: "EventStore",
      Item: itm,
      ConditionExpression: "attribute_not_exists(PK) AND attribute_not_exists(SK)"
    }
  }));
  if (MODE === 'batch') {
    for (const t of transactItems) {
      buffer.push(t.Put.Item);
    }
    return;
  }

  await docClient.send(new TransactWriteCommand({ TransactItems: transactItems }));
}

export interface EventStore {
  appendEvent: typeof appendEvent;
  getEventsForAggregate: typeof getEventsForAggregate;
  getEventsByPrefix: typeof getEventsByPrefix;
  subscribe: typeof subscribe;
}

export const eventStore: EventStore = {
  appendEvent,
  getEventsForAggregate,
  getEventsByPrefix,
  subscribe
};
