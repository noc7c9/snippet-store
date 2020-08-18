const { assertIsSnippet } = require('../../utils');

const randomId = () => `${Math.floor(Math.random() * 1e16)}`;

exports.init = async () => {
    const data = {};
    return {
        list: async () => Object.values(data),
        create: async (snippet) => {
            assertIsSnippet(snippet);
            const id = randomId();
            data[id] = snippet;
            console.log(`CREATED[${id}]`, data);
            return { id };
        },
        update: async (id, snippet) => {
            assertIsSnippet(snippet);
            data[id] = snippet;
            console.log(`UPDATED[${id}]`, data);
        },
        delete: async (id) => {
            delete data[id];
            console.log(`DELETED[${id}]`, data);
        },
    };
};
