const uuid = require('uuid');

const { assertIsSnippet } = require('../../utils');

exports.init = async () => {
    const data = {};
    return {
        list: async () => Object.values(data),
        create: async (snippet) => {
            assertIsSnippet(snippet);
            const id = uuid.v4();
            data[id] = { id, ...snippet };
            console.log(`CREATED[${id}]`, data);
            return { id };
        },
        update: async (id, snippet) => {
            assertIsSnippet(snippet);
            data[id] = { id, ...snippet };
            console.log(`UPDATED[${id}]`, data);
        },
        delete: async (id) => {
            delete data[id];
            console.log(`DELETED[${id}]`, data);
        },
    };
};
