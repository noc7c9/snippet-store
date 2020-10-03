import { types, logger } from '@snippet-store/common';

const log = logger('LOCAL-STORAGE');

const RECENT_KEY = 'RECENT_STORES';
const RECENT_MAX = 50;

const get = <T>(key: string, defaultValue: T): T => {
    log('get', key);
    try {
        const data = localStorage.getItem(key);
        return data == null ? defaultValue : (JSON.parse(data) as T);
    } catch (e) {
        return defaultValue;
    }
};

const set = (key: string, value: unknown) => {
    log('set', key, value);
    localStorage.setItem(key, JSON.stringify(value));
};

type RecentStores = types.Store[];

export const getAllRecentStores = (): RecentStores => {
    return get(RECENT_KEY, []);
};

export const addRecentStore = (store: types.Store): void => {
    const data = get<RecentStores>(RECENT_KEY, []);

    // Remove if already in the existing data
    for (let i = 0; i < data.length; i++) {
        if (data[i].id == store.id) {
            data.splice(i, 1);
            break;
        }
    }

    // Add to the front (ie. most recent)
    data.unshift(store);

    // Limit the number of recent stores
    data.splice(RECENT_MAX, Infinity);

    set(RECENT_KEY, data);
};

const toPinKey = (storeId: string): string => `PINNED/${storeId}`;

type PinData = Record<string, boolean>;

export const getPinData = (
    storeId: string,
): ((snippetId: string) => boolean) => {
    const data = get<PinData>(toPinKey(storeId), {});
    return (snippetId: string): boolean => data[snippetId] ?? false;
};

export const togglePinned = (storeId: string, snippetId: string): boolean => {
    const key = toPinKey(storeId);
    const data = get<PinData>(key, {});
    if (data[snippetId]) {
        delete data[snippetId];
    } else {
        data[snippetId] = true;
    }
    set(key, data);
    return data[snippetId] ?? false;
};
