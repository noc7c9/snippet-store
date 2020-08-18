const { MongoClient, ObjectID } = require('mongodb');

const { assertIsSnippet } = require('../../utils');

// TODO: update to a version of mongodb that supports promises
const promised = (context, method, ...args) =>
    new Promise((resolve, reject) => {
        const fn = context[method].bind(context);
        fn(...args, (error, value) => (error ? reject(error) : resolve(value)));
    });

const connect = (uri) => promised(MongoClient, 'connect', uri);

exports.init = async ({ uri }) => {
    const client = await connect(uri);
    console.log(`Connected to mongo database. (${uri})`);

    const db = client.db();
    const coll = db.collection('snippets');

    return {
        list: () => promised(coll.find({}), 'toArray'),
        create: async (snippet) => {
            assertIsSnippet(snippet);
            const result = await promised(coll, 'insert', snippet);
            return { id: result.ops[0]._id };
        },
        update: async (id, snippet) => {
            assertIsSnippet(snippet);
            const _id = new ObjectID(id);
            await promised(coll, 'findOneAndReplace', { _id }, snippet);
        },
        delete: async (id) => {
            const _id = new ObjectID(id);
            await promised(coll, 'findOneAndDelete', { _id });
        },
    };
};
