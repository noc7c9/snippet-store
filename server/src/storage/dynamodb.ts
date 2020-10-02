import { types, expect, logger, sluggify } from '@snippet-store/common';
import { DynamoDB } from '@aws-sdk/client-dynamodb';

import { StorageAPI } from './types';
import generateId from './uuid62';

const log = logger('STORAGE::DynamoDB');

const { notNull } = expect;

export default ({
    tableName: TableName,
}: {
    tableName: string;
}): StorageAPI => {
    const client = new DynamoDB({
        region: 'ap-southeast-2',
        apiVersion: '2012-08-10',
    });

    return {
        stores: {
            list: async ({ first = 50, after = null } = {}) => {
                log('stores.list:', { first, after });

                if (after != null) {
                    throw new Error("stores.list doesn't support after");
                }

                const { Items } = await client.query({
                    TableName,
                    ExpressionAttributeValues: {
                        ':pk': { S: 'STORES' },
                    },
                    KeyConditionExpression: 'pk = :pk',
                    Limit: first,
                });
                return (Items || []).map((item) => ({
                    id: notNull(item.sk.S),
                    title: notNull(item.title.S),
                    description: notNull(item.description.S),
                }));
            },

            create: async (data) => {
                log('stores.create:', { title: data.title });
                const id = sluggify(data.title);

                const successful = await client
                    .putItem({
                        TableName,
                        Item: {
                            pk: { S: 'STORES' },
                            sk: { S: id },
                            title: { S: data.title },
                            description: { S: data.description },
                        },
                        // Only putItem if a store with the given ID doesn't
                        // already exist
                        ConditionExpression: 'attribute_not_exists(sk)',
                    })
                    .then(() => true)
                    .catch((e) => {
                        if (e.__type === 'ConditionalCheckFailedException') {
                            return false;
                        }
                        throw e;
                    });

                if (!successful) {
                    throw new Error(`Store with ID ${id} already exists`);
                }

                return { id };
            },

            fetch: async ({ id }) => {
                log('stores.fetch:', { id });

                const { Item } = await client.getItem({
                    TableName,
                    Key: {
                        pk: { S: 'STORES' },
                        sk: { S: id },
                    },
                });

                if (Item == null) {
                    throw new Error(`Unknown ID: ${id}`);
                }

                return {
                    id: notNull(Item.sk.S),
                    title: notNull(Item.title.S),
                    description: notNull(Item.description.S),
                };
            },

            update: async ({ id }, data) => {
                log('stores.fetch:', { id });
                throw new Error('UNIMPLEMENTED');
            },
        },

        snippets: {
            list: async ({ storeId, first = 50, after }) => {
                log('snippets.list:', { storeId, first, after });

                if (after != null) {
                    throw new Error("snippets.list doesn't support after");
                }

                const { Items } = await client.query({
                    TableName,
                    ExpressionAttributeValues: {
                        ':pk': { S: `${storeId}/SNIPPETS` },
                    },
                    KeyConditionExpression: 'pk = :pk',
                    Limit: first,
                });
                return (Items || []).map((item) => ({
                    id: notNull(item.sk.S),
                    title: notNull(item.title.S),
                    content: notNull(item.content.S),
                    tags: notNull(item.tags.L).map((t) => notNull(t.S)),
                    copyCount: parseInt(notNull(item.tags.N)),
                }));
            },

            create: async ({ storeId }, data) => {
                log('snippets.create:', { storeId, title: data.title });

                const id = generateId();
                await client.putItem({
                    TableName,
                    Item: {
                        pk: { S: `${storeId}/SNIPPETS` },
                        sk: { S: id },
                        title: { S: data.title },
                        content: { S: data.content },
                        tags: { L: data.tags.map((tag) => ({ S: tag })) },
                        copyCount: { N: '0' },
                    },
                });

                return { id };
            },

            update: async ({ storeId, id }, data) => {
                log('snippets.update:', { storeId, id });

                await client.updateItem({
                    TableName,
                    Key: {
                        pk: { S: `${storeId}/SNIPPETS` },
                        sk: { S: id },
                    },
                    ExpressionAttributeValues: {
                        ':title': { S: data.title },
                        ':content': { S: data.content },
                        ':tags': { L: data.tags.map((tag) => ({ S: tag })) },
                    },
                    UpdateExpression:
                        'SET title = :title, content = :content, tags = :tags',
                });
            },

            incrementCopyCount: async ({ storeId, id }) => {
                log('snippets.incrementCopyCount:', { storeId, id });

                await client.updateItem({
                    TableName,
                    Key: {
                        pk: { S: `${storeId}/SNIPPETS` },
                        sk: { S: id },
                    },
                    UpdateExpression: 'ADD copyCount = copyCount + 1',
                });
            },

            delete: async ({ storeId, id }) => {
                log('snippets.delete:', { storeId, id });

                await client.deleteItem({
                    TableName,
                    Key: {
                        pk: { S: `${storeId}/SNIPPETS` },
                        sk: { S: id },
                    },
                });
            },
        },
    };
};
