import { types, logger } from '@snippet-store/common';

import * as config from '../config';

const log = logger('API');

const url = (path: string, query = {}) => {
    // JSON roundtrip removes undefined values
    const queryString = new URLSearchParams(JSON.parse(JSON.stringify(query)));
    return `${config.API_URL}/api${path}?${queryString}`;
};

type Res<T> = Promise<T | { error: string }>;

export default {
    store: {
        list: ({
            first,
            after,
        }: {
            first?: number;
            after?: string;
        }): Res<{ stores: types.Store[] }> => {
            log('GET /stores');
            return fetch(url('/stores', { first, after }), {
                method: 'GET',
            }).then((res) => res.json());
        },

        create: (data: types.StorePayload): Res<{ id: string }> => {
            log('POST /stores');
            return fetch(url('/stores'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            }).then((res) => res.json());
        },

        fetch: ({
            storeId,
        }: {
            storeId: string;
        }): Res<{ store: types.Store }> => {
            const path = `/stores/${storeId}`;
            log('GET', path);
            return fetch(url(path), {
                method: 'GET',
            }).then((res) => res.json());
        },
    },

    snippets: {
        list: ({
            storeId,
            first,
            after,
        }: {
            storeId: string;
            first?: number;
            after?: string;
        }): Res<{ snippets: types.Snippet[] }> => {
            const path = `/stores/${storeId}/snippets`;
            log('GET', path);
            return fetch(url(path, { first, after }), {
                method: 'GET',
            }).then((res) => res.json());
        },

        create: (
            { storeId }: { storeId: string },
            data: types.SnippetPayload,
        ): Res<{ id: string }> => {
            const path = `/stores/${storeId}/snippets`;
            log('POST', path);
            return fetch(url(path), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            }).then((res) => res.json());
        },

        update: (
            { storeId, id }: { storeId: string; id: string },
            data: types.SnippetPayload,
        ): Res<{ ok: true }> => {
            const path = `/stores/${storeId}/snippets/${id}`;
            log('PUT', path);
            return fetch(url(path), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            }).then((res) => res.json());
        },

        remove: ({
            storeId,
            id,
        }: {
            storeId: string;
            id: string;
        }): Res<{ ok: true }> => {
            const path = `/stores/${storeId}/snippets/${id}`;
            log('DELETE', path);
            return fetch(url(path), {
                method: 'DELETE',
            }).then((res) => res.json());
        },
    },
};
