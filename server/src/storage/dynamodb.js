const { DynamoDB } = require('@aws-sdk/client-dynamodb');
const uuid = require('uuid');

const { assertIsSnippet } = require('../utils');

exports.init = ({ tableName: TableName }) => {
    const client = new DynamoDB({
        region: 'ap-southeast-2',
        apiVersion: '2012-08-10',
    });

    return {
        list: async () => {
            const { Items } = await client.query({
                TableName,
                ExpressionAttributeValues: {
                    ':pk': { S: 'snippet' },
                },
                KeyConditionExpression: 'pk = :pk',
            });
            return Items.map((item) => ({
                id: item.sk.S,
                title: item.title.S,
                content: item.content.S,
                tags: item.tags.L.map((t) => t.S),
            }));
        },
        create: async (snippet) => {
            assertIsSnippet(snippet);
            const id = uuid.v4();

            await client.putItem({
                TableName,
                Item: {
                    pk: { S: 'snippet' },
                    sk: { S: id },
                    title: { S: snippet.title },
                    content: { S: snippet.content },
                    tags: { L: snippet.tags.map((tag) => ({ S: tag })) },
                },
            });
            return { id };
        },
        update: async (id, snippet) => {
            assertIsSnippet(snippet);
            await client.updateItem({
                TableName,
                Key: {
                    pk: { S: 'snippet' },
                    sk: { S: id },
                },
                ExpressionAttributeValues: {
                    ':title': { S: snippet.title },
                    ':content': { S: snippet.content },
                    ':tags': { L: snippet.tags.map((tag) => ({ S: tag })) },
                },
                UpdateExpression:
                    'SET title = :title, content = :content, tags = :tags',
            });
        },
        delete: async (id) => {
            await client.deleteItem({
                TableName,
                Key: {
                    pk: { S: 'snippet' },
                    sk: { S: id },
                },
            });
        },
    };
};
