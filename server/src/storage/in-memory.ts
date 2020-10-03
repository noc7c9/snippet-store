import { types, logger, sluggify } from '@snippet-store/common';

import { StorageAPI } from './types';
import generateId from './uuid62';
import mockDataGenerator from '../mock-data-generator';

const log = logger('STORAGE::In-Memory');

export default ({
    mock: mockDataPreset,
}: { mock?: keyof typeof mockDataPresets } = {}): StorageAPI => {
    const storage: {
        stores: Record<string, types.Store>;
        snippets: Record<string, Record<string, types.Snippet>>;
    } = { stores: {}, snippets: {} };

    const api: StorageAPI = {
        stores: {
            /* eslint-disable @typescript-eslint/require-await */
            list: async ({ first = 50, after = null } = {}) => {
                log('stores.list:', { first, after });
                const stores = Object.values(storage.stores);

                if (after == null) {
                    return stores.slice(0, first);
                }

                const index = stores.findIndex((e) => e.id === after);
                if (index === -1) {
                    throw new Error(`Unknown after ID: ${after}`);
                }
                return stores.slice(index, index + first);
            },
            create: async (data) => {
                log('stores.create:', { title: data.title });
                const id = sluggify(data.title);

                if (id in storage.stores) {
                    throw new Error(`Store with ID ${id} already exists`);
                }

                const store = {
                    id,
                    title: data.title,
                    description: data.description,
                };
                storage.stores[id] = store;
                storage.snippets[id] = {};
                return store;
            },
            fetch: async ({ id }) => {
                log('stores.fetch:', { id });
                if (!(id in storage.stores)) {
                    throw new Error(`Unknown ID: ${id}`);
                }
                return storage.stores[id];
            },
            update: async ({ id }, data) => {
                log('stores.fetch:', { id });
                if (!(id in storage.stores)) {
                    throw new Error(`Unknown ID: ${id}`);
                }
                storage.stores[id] = {
                    id,
                    title: data.title,
                    description: data.description,
                };
            },
        },

        snippets: {
            list: async ({ storeId, first = 50, after }) => {
                log('snippets.list:', { storeId, first, after });
                if (!(storeId in storage.stores)) {
                    throw new Error(`Unknown Store ID: ${storeId}`);
                }
                const snippets = Object.values(storage.snippets[storeId]);

                if (after == null) {
                    return snippets.slice(0, first);
                }

                const index = snippets.findIndex((e) => e.id === after);
                if (index === -1) {
                    throw new Error(`Unknown after ID: ${after}`);
                }
                return snippets.slice(index, index + first);
            },
            create: async ({ storeId }, data) => {
                log('snippets.create:', { storeId, title: data.title });
                if (!(storeId in storage.stores)) {
                    throw new Error(`Unknown Store ID: ${storeId}`);
                }
                const snippets = storage.snippets[storeId];

                const id = generateId();
                const snippet = {
                    id,
                    title: data.title,
                    content: data.content,
                    tags: data.tags,
                    copyCount: 0,
                };
                snippets[id] = snippet;
                return snippet;
            },
            update: async ({ storeId, id }, data) => {
                log('snippets.update:', { storeId, id });
                if (!(storeId in storage.stores)) {
                    throw new Error(`Unknown Store ID: ${storeId}`);
                }
                const snippets = storage.snippets[storeId];

                if (!(id in snippets)) {
                    throw new Error(`Unknown ID: ${id}`);
                }
                snippets[id] = {
                    ...snippets[id],
                    title: data.title,
                    content: data.content,
                    tags: data.tags,
                };
            },
            incrementCopyCount: async ({ storeId, id }) => {
                log('snippets.incrementCopyCount:', { storeId, id });
                if (!(storeId in storage.stores)) {
                    throw new Error(`Unknown Store ID: ${storeId}`);
                }
                const snippets = storage.snippets[storeId];

                if (!(id in snippets)) {
                    throw new Error(`Unknown ID: ${id}`);
                }
                snippets[id] = {
                    ...snippets[id],
                    copyCount: snippets[id].copyCount + 1,
                };
            },
            delete: async ({ storeId, id }) => {
                log('snippets.delete:', { storeId, id });
                if (!(storeId in storage.stores)) {
                    throw new Error(`Unknown Store ID: ${storeId}`);
                }
                const snippets = storage.snippets[storeId];

                if (!(id in snippets)) {
                    throw new Error(`Unknown ID: ${id}`);
                }
                delete snippets[id];
            },
            /* eslint-enable */
        },
    };

    if (mockDataPreset != null) {
        loadMockData(api, mockDataPreset).catch(() => {
            // ignore
        });
    }

    return api;
};

const loadMockData = async (
    api: StorageAPI,
    mockDataPreset: keyof typeof mockDataPresets,
) => {
    log('Loading mock data');
    const mockDataConfig = mockDataPresets[mockDataPreset];
    const mockData = mockDataGenerator(mockDataConfig);

    await Promise.all(
        mockData.map(async (mockStore) => {
            const { id: storeId } = await api.stores.create(mockStore);
            await Promise.all(
                mockStore.snippets.map((mockSnippet) =>
                    api.snippets.create({ storeId }, mockSnippet),
                ),
            );
        }),
    );

    console.log('='.repeat(process.stdout.columns));
    console.log('Stores:');
    mockData.forEach((mockStore) => {
        console.log('-', sluggify(mockStore.title));
    });
    console.log('='.repeat(process.stdout.columns));
};

const mockDataPresets: Record<
    string,
    Parameters<typeof mockDataGenerator>[0]
> = {
    tiny: {
        numStores: [1],
        storeConfig: {
            numSnippets: [3, 5],
            title: [3, 5],
            description: [5, 10],
            numTotalTags: [5],
        },
        snippetConfig: { title: [1, 7], content: [5, 25], numTags: [0, 1] },
    },
    small: {
        numStores: [5],
        storeConfig: {
            numSnippets: [5, 10],
            title: [3, 5],
            description: [5, 25],
            numTotalTags: [10],
        },
        snippetConfig: { title: [1, 7], content: [5, 50], numTags: [0, 3] },
    },
    medium: {
        numStores: [20],
        storeConfig: {
            numSnippets: [5, 50],
            title: [3, 5],
            description: [5, 25],
            numTotalTags: [25],
        },
        snippetConfig: { title: [1, 7], content: [5, 50], numTags: [0, 5] },
    },
    large: {
        numStores: [100],
        storeConfig: {
            numSnippets: [5, 100],
            title: [3, 5],
            description: [5, 25],
            numTotalTags: [75],
        },
        snippetConfig: { title: [1, 7], content: [5, 50], numTags: [0, 10] },
    },
    massive: {
        numStores: [250],
        storeConfig: {
            numSnippets: [5, 1000],
            title: [3, 5],
            description: [5, 25],
            numTotalTags: [250],
        },
        snippetConfig: { title: [1, 7], content: [5, 50], numTags: [0, 25] },
    },
};
