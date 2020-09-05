import { types, logger } from '@snippet-store/common';

import * as config from '../config';

const log = logger('API');

const url = (path: string, query = {}) => {
    // JSON roundtrip removes undefined values
    const queryString = new URLSearchParams(JSON.parse(JSON.stringify(query)));
    return `${config.API_URL}/api${path}?${queryString}`;
};

const wrappedFetch = async (url: string, opts: Parameters<typeof fetch>[1]) => {
    const res = await fetch(url, opts);
    const { status } = res;
    const data = await res.json();

    // Just return if the code is okay
    if (status >= 200 && status < 300) {
        return data;
    }

    // Just return if the payload has an error field
    if ('error' in data) {
        return data;
    }

    // Bad code and no error field in payload so add an error field
    return { ...data, error: status.toString() };
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
            return wrappedFetch(url('/stores', { first, after }), {
                method: 'GET',
            });
        },

        create: (data: types.StorePayload): Res<{ id: string }> => {
            log('POST /stores');
            return wrappedFetch(url('/stores'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
        },

        fetch: ({
            storeId,
        }: {
            storeId: string;
        }): Res<{ store: types.Store }> => {
            const path = `/stores/${storeId}`;
            log('GET', path);
            return wrappedFetch(url(path), {
                method: 'GET',
            });
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
            return wrappedFetch(url(path, { first, after }), {
                method: 'GET',
            });
        },

        create: (
            { storeId }: { storeId: string },
            data: types.SnippetPayload,
        ): Res<{ id: string }> => {
            const path = `/stores/${storeId}/snippets`;
            log('POST', path);
            return wrappedFetch(url(path), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
        },

        update: (
            { storeId, id }: { storeId: string; id: string },
            data: types.SnippetPayload,
        ): Res<{ ok: true }> => {
            const path = `/stores/${storeId}/snippets/${id}`;
            log('PUT', path);
            return wrappedFetch(url(path), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
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
            return wrappedFetch(url(path), {
                method: 'DELETE',
            });
        },
    },
};
