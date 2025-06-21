import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const REGION = process.env.AWS_REGION || 'eu-west-1'; // 👈 fallback por si no tienes .env cargado

const ddbClient = new DynamoDBClient({ region: REGION });
export const client = DynamoDBDocumentClient.from(ddbClient);

export async function appendEvent(event: any, aggregateId: string, version: number) {
  const item = {
    PK: `contact#${aggregateId}`,
    SK: `v${String(version).padStart(10, "0")}`,
    ...event,
  };

  await client.send(new PutCommand({
    TableName: "EventStore",
    Item: item,
    ConditionExpression: "attribute_not_exists(PK) AND attribute_not_exists(SK)"
  }));
}