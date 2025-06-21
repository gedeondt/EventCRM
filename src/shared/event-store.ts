import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  PutCommand
} from "@aws-sdk/lib-dynamodb";

const REGION = process.env.AWS_REGION || 'eu-west-1';

const client = new DynamoDBClient({ region: REGION });

export const docClient = DynamoDBDocumentClient.from(client);

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

export async function appendEvent(
  event: any,
  aggregateType: string,
  aggregateId: string,
  version: number
) {
  const item = {
    PK: `${aggregateType}#${aggregateId}`,
    SK: `v${String(version).padStart(10, "0")}`,
    ...event
  };

  logUndefinedPaths(item);
  assertNoUndefined(item);

  await docClient.send(new PutCommand({
    TableName: "EventStore",
    Item: item,
    ConditionExpression: "attribute_not_exists(PK) AND attribute_not_exists(SK)"
  }));
}