import { types } from '@snippet-store/common';

export type StorageAPI = {
    stores: {
        list: (args: {
            first?: number;
            after?: string;
        }) => Promise<types.Store[]>;
        create: (data: types.StorePayload) => Promise<types.Store>;
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
        ) => Promise<types.Snippet>;
        update: (
            args: { storeId: string; id: string },
            data: types.SnippetPayload,
        ) => Promise<void>;
        delete: (args: { storeId: string; id: string }) => Promise<void>;
    };
};
