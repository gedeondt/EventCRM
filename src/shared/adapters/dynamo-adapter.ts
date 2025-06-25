import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  QueryCommand,
  ScanCommand,
  TransactWriteCommand,
  BatchWriteCommand,
  PutCommand
} from '@aws-sdk/lib-dynamodb';
import type { EventStoreAdapter } from './event-store-adapter.js';

const REGION = process.env.AWS_REGION || 'eu-west-1';
const client = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(client);

export class DynamoDBAdapter implements EventStoreAdapter {
  async queryEvents(pk: string): Promise<any[]> {
    const result = await docClient.send(
      new QueryCommand({
        TableName: 'EventStore',
        KeyConditionExpression: 'PK = :pk',
        ExpressionAttributeValues: { ':pk': pk },
        ScanIndexForward: true
      })
    );
    return result.Items || [];
  }

  async scanEvents(prefix: string): Promise<any[]> {
    const items: any[] = [];
    let ExclusiveStartKey: Record<string, any> | undefined = undefined;
    do {
      const result = await docClient.send(
        new ScanCommand({
          TableName: 'EventStore',
          FilterExpression: 'begins_with(PK, :pk)',
          ExpressionAttributeValues: { ':pk': prefix },
          ExclusiveStartKey
        })
      );
      if (result.Items) items.push(...result.Items);
      ExclusiveStartKey = result.LastEvaluatedKey as any;
    } while (ExclusiveStartKey);
    return items;
  }

  async getProjection(pk: string, name: string): Promise<any | null> {
    const res = await docClient.send(
      new QueryCommand({
        TableName: 'ProjectionStore',
        KeyConditionExpression: 'PK = :pk AND SK = :sk',
        ExpressionAttributeValues: { ':pk': pk, ':sk': name },
        Limit: 1
      })
    );
    return res.Items?.[0] || null;
  }

  async putProjection(item: any): Promise<void> {
    await docClient.send(new PutCommand({ TableName: 'ProjectionStore', Item: item }));
  }

  async transactWriteEvents(items: any[]): Promise<void> {
    const transactItems = items.map((itm) => ({
      Put: {
        TableName: 'EventStore',
        Item: itm,
        ConditionExpression: 'attribute_not_exists(PK) AND attribute_not_exists(SK)'
      }
    }));
    await docClient.send(new TransactWriteCommand({ TransactItems: transactItems }));
  }

  async batchWriteEvents(items: any[]): Promise<void> {
    for (let i = 0; i < items.length; i += 25) {
      const slice = items.slice(i, i + 25);
      const batch = slice.map((b) => ({ PutRequest: { Item: b } }));
      let requestItems: Record<string, any> = { EventStore: batch };
      do {
        const res = await docClient.send(new BatchWriteCommand({ RequestItems: requestItems }));
        requestItems =
          res.UnprocessedItems && res.UnprocessedItems.EventStore?.length
            ? { EventStore: res.UnprocessedItems.EventStore }
            : (undefined as any);
      } while (requestItems);
    }
  }
}
