import express from 'express';

import storage from './storage';
import { assertIsStore, assertIsSnippet } from './utils';

export const listStores = async (
    { query: { first, after } }: express.Request,
    res: express.Response,
): Promise<void> => {
    console.log('Listing stores:', { first, after });

    const stores = await storage.stores.list({
        first: first == null ? undefined : parseInt(first as string),
        after: after as string,
    });
    res.json({ stores });
};

export const createStore = async (
    { body }: express.Request,
    res: express.Response,
): Promise<void> => {
    console.log('Creating store:', body);

    const store = assertIsStore(body);
    const { id } = await storage.stores.create(store);
    res.status(201);
    res.json({ id });
};

export const fetchStore = async (
    { params: { storeId } }: express.Request,
    res: express.Response,
): Promise<void> => {
    console.log('Getting store:', storeId);

    const store = await storage.stores.fetch({ id: storeId });
    res.json({ store });
};

export const updateStore = async (
    { body, params: { storeId } }: express.Request,
    res: express.Response,
): Promise<void> => {
    console.log('Updating store', storeId, body);

    const store = assertIsStore(body);
    await storage.stores.update({ id: storeId }, store);
    res.json({ ok: true });
};

export const listSnippets = async (
    { params: { storeId }, query: { first, after } }: express.Request,
    res: express.Response,
): Promise<void> => {
    console.log('Listing snippets:', { storeId, first, after });

    const snippets = await storage.snippets.list({
        storeId,
        first: first == null ? undefined : parseInt(first as string),
        after: after as string,
    });
    res.json({ snippets });
};

export const createSnippet = async (
    { body, params: { storeId } }: express.Request,
    res: express.Response,
): Promise<void> => {
    console.log('Creating snippet:', body);

    const snippet = assertIsSnippet(body);
    const { id } = await storage.snippets.create({ storeId }, snippet);
    res.status(201);
    res.json({ id });
};

export const updateSnippet = async (
    { body, params: { storeId, id } }: express.Request,
    res: express.Response,
): Promise<void> => {
    console.log('Updating snippet', storeId, id, body);

    const snippet = assertIsSnippet(body);
    await storage.snippets.update({ storeId, id }, snippet);
    res.json({ ok: true });
};

export const incrementSnippetCopyCount = async (
    { params: { storeId, id } }: express.Request,
    res: express.Response,
): Promise<void> => {
    console.log('Incrementing snippet copyCount', storeId, id);

    await storage.snippets.incrementCopyCount({ storeId, id });
    res.json({ ok: true });
};

export const deleteSnippet = async (
    { params: { storeId, id } }: express.Request,
    res: express.Response,
): Promise<void> => {
    console.log('Deleting snippet', storeId, id);

    await storage.snippets.delete({ storeId, id });
    res.json({ ok: true });
};
