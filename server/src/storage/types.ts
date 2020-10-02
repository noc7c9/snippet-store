import { types } from '@snippet-store/common';

export type StorageAPI = {
    stores: {
        list: (args: {
            first?: number;
            after?: string;
        }) => Promise<types.Store[]>;
        create: (data: types.StorePayload) => Promise<Pick<types.Store, 'id'>>;
        fetch: (args: { id: string }) => Promise<types.Store>;
        update: (
            args: { id: string },
            data: types.StorePayload,
        ) => Promise<void>;
    };
    snippets: {
        list: (args: {
            storeId: string;
            first?: number;
            after?: string;
        }) => Promise<types.Snippet[]>;
        create: (
            args: { storeId: string },
            data: types.SnippetPayload,
        ) => Promise<Pick<types.Snippet, 'id'>>;
        update: (
            args: { storeId: string; id: string },
            data: types.SnippetPayload,
        ) => Promise<void>;
        incrementCopyCount: (args: {
            storeId: string;
            id: string;
        }) => Promise<void>;
        delete: (args: { storeId: string; id: string }) => Promise<void>;
    };
};
