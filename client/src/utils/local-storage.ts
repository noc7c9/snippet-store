import { types, logger } from '@snippet-store/common';

const log = logger('LOCAL-STORAGE');

const RECENT_KEY = 'RECENT_STORES';
const RECENT_MAX = 50;

const get = (key: string, defaultValue: any = null): any => {
    log('get', key);
    try {
        const data = localStorage.getItem(key);
        return data == null ? defaultValue : JSON.parse(data);
    } catch (e) {
        return defaultValue;
    }
};

const set = (key: string, value: unknown) => {
    log('set', key, value);
    localStorage.setItem(key, JSON.stringify(value));
};

export const getAllRecentStores = (): types.Store[] => {
    return get(RECENT_KEY, []);
};

export const addRecentStore = (store: types.Store) => {
    const data = get(RECENT_KEY, []);

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
