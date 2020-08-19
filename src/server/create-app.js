const assert = require('assert');
const express = require('express');
const bodyParser = require('body-parser');

const config = require('./config');

const storageInMemory = require('./storage/in-memory');
const storageMongoDb = require('./storage/mongodb');
const storageDynamoDb = require('./storage/dynamodb');

module.exports = async () => {
    const app = express();

    app.set('view engine', 'pug');

    app.use(express.static('public'));
    app.use(bodyParser.urlencoded({ extended: true }));

    let storage;
    if (config.STORAGE === 'in-memory') {
        storage = await storageInMemory.init();
    } else if (config.STORAGE === 'mongodb') {
        assert(config.MONGODB_URI, 'MONGODB_URI env var is not set');
        storage = await storageMongo.init({ uri: config.MONGODB_URI });
    } else if (config.STORAGE === 'dynamodb') {
        assert(config.DYNAMODB_TABLE, 'DYNAMODB_TABLE env var is not set');
        storage = await storageDynamoDb.init({
            tableName: config.DYNAMODB_TABLE,
        });
    } else {
        throw new Error(`Unknown env.STORAGE value: ${config.STORAGE}`);
    }

    app.get('/', async (req, res) => {
        // TODO: render an error page if the database fails
        const snippets = await storage.list().catch(() => []);
        res.render('index', { snippets });
    });

    // TODO: change to GET /api/snippets
    app.post('/api/read', async (req, res) => {
        try {
            const snippets = await storage.list();
            // TODO: change this to { snippets: [] }
            res.json(snippets);
        } catch (error) {
            console.error(error);
            res.json({ error: 'Failed to list snippets' });
        }
    });

    // TODO: change to POST /api/snippets
    app.post('/api/create', async (req, res) => {
        const snippet = {
            title: req.body.title.trim(),
            content: req.body.content.trim(),
            tags: req.body.tags || [],
        };

        if (!(snippet.title && snippet.content)) {
            // TODO: change to
            // res.json({ error: 'Missing title and/or content' });
            res.send('ERR: Missing title/content');
        }

        try {
            const { id } = await storage.create(snippet);
            // TODO: change to
            // res.json({ id });
            res.send(id);
        } catch (error) {
            console.error(error);
            // TODO: change to
            // res.json({ error: 'Unable to create snippet' });
            res.send('ERROR');
        }
    });

    // TODO: change to PUT /api/snippets/:id
    app.post('/api/update', async (req, res) => {
        const { id } = req.body;
        const snippet = {
            title: req.body.title.trim(),
            content: req.body.content.trim(),
            tags: req.body.tags || [],
        };

        if (!(id && snippet.title && snippet.content)) {
            // TODO: change to
            // res.json({ error: 'Missing title and/or content' });
            res.send('ERR: Missing title/content');
        }

        try {
            await storage.update(id, snippet);
            // TODO change to
            // res.json({ ok: true });
            res.send('OK');
        } catch (error) {
            console.error(error);
            // TODO change to
            // res.json({ error: 'Unable to update snippet' });
            res.send('ERROR');
        }
    });

    // TODO: change to DELETE /api/snippets/:id
    app.post('/api/delete', async (req, res) => {
        try {
            await storage.delete(req.body.id);
            // TODO change to
            // res.json({ ok: true });
            res.send('OK');
        } catch (error) {
            console.error(error);
            // TODO change to
            // res.json({ error: 'Unable to delete snippet' });
            res.send('ERROR');
        }
    });

    app.use(function (req, res) {
        res.status(404);
        res.render('404');
    });

    return app;
};
