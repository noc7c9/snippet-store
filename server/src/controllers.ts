import express from 'express';

import storage from './storage';
import { assertIsStore, assertIsSnippet } from './utils';

export const listStores = async (
    req: express.Request,
    res: express.Response,
) => {
    const { first, after } = req.query;
    console.log('Listing stores:', { first, after });

    const stores = await storage.stores.list({
        first: first == null ? undefined : parseInt(first as string),
        after: after as string,
    });
    res.json({ stores });
};

export const createStore = async (
    req: express.Request,
    res: express.Response,
) => {
    const store = req.body;
    console.log('Creating store:', store);

    assertIsStore(store);
    const { id } = await storage.stores.create(store);
    res.status(201);
    res.json({ id });
};

export const fetchStore = async (
    req: express.Request,
    res: express.Response,
) => {
    const { storeId } = req.params;
    console.log('Getting store:', storeId);

    const store = await storage.stores.fetch({ id: storeId });
    res.json({ store });
};

export const updateStore = async (
    req: express.Request,
    res: express.Response,
) => {
    const { storeId } = req.params;
    const store = req.body;
    console.log('Updating store', storeId, store);

    assertIsStore(store);
    await storage.stores.update({ id: storeId }, store);
    res.json({ ok: true });
};

export const listSnippets = async (
    req: express.Request,
    res: express.Response,
) => {
    const { storeId } = req.params;
    const { first, after } = req.query;
    console.log('Listing snippets:', { storeId, first, after });

    const snippets = await storage.snippets.list({
        storeId,
        first: first == null ? undefined : parseInt(first as string),
        after: after as string,
    });
    res.json({ snippets });
};

export const createSnippet = async (
    req: express.Request,
    res: express.Response,
) => {
    const { storeId } = req.params;
    const snippet = req.body;
    console.log('Creating snippet:', snippet);

    assertIsSnippet(snippet);
    const { id } = await storage.snippets.create({ storeId }, snippet);
    res.status(201);
    res.json({ id });
};

export const updateSnippet = async (
    req: express.Request,
    res: express.Response,
) => {
    const { storeId, id } = req.params;
    const snippet = req.body;
    console.log('Updating snippet', storeId, id, snippet);

    assertIsSnippet(snippet);
    await storage.snippets.update({ storeId, id }, snippet);
    res.json({ ok: true });
};

export const incrementSnippetCopyCount = async (
    req: express.Request,
    res: express.Response,
) => {
    const { storeId, id } = req.params;
    console.log('Incrementing snippet copyCount', storeId, id);

    await storage.snippets.incrementCopyCount({ storeId, id });
    res.json({ ok: true });
};

export const deleteSnippet = async (
    req: express.Request,
    res: express.Response,
) => {
    const { storeId, id } = req.params;
    console.log('Deleting snippet', storeId, id);

    await storage.snippets.delete({ storeId, id });
    res.json({ ok: true });
};
