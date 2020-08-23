const assert = require('assert');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');

const config = require('./config');
const { assertIsSnippet } = require('./utils');

const storageInMemory = require('./storage/in-memory');
const storageDynamoDb = require('./storage/dynamodb');

console.log('Loaded Config:', JSON.stringify(config));

const app = express();

app.use(morgan(config.NODE_ENV === 'development' ? 'dev' : 'combined'));
app.use(bodyParser.json());

// Necessary during development because ports are different
if (config.NODE_ENV === 'development') {
    app.use(cors());
}

let storage;
if (config.STORAGE === 'in-memory') {
    console.log('Using In-Memory storage');
    storage = storageInMemory.init();
} else if (config.STORAGE === 'dynamodb') {
    assert(config.DYNAMODB_TABLE, 'DYNAMODB_TABLE env var is not set');
    console.log(`Using DynamoDB storage (${config.DYNAMODB_TABLE})`);
    storage = storageDynamoDb.init({
        tableName: config.DYNAMODB_TABLE,
    });
} else {
    throw new Error(`Unknown env.STORAGE value: ${config.STORAGE}`);
}

app.get('/api/snippets', async (req, res) => {
    try {
        console.log('Listing snippets');
        const snippets = await storage.list();
        res.json({ snippets });
    } catch (error) {
        console.error(error);
        res.json({ error: 'Failed to list snippets' });
    }
});

app.post('/api/snippets', async (req, res) => {
    try {
        console.log('Validating snippet', req.body);
        assertIsSnippet(req.body);
    } catch (err) {
        res.json({ error: err.message });
        return;
    }

    const snippet = {
        title: req.body.title.trim(),
        content: req.body.content.trim(),
        tags: req.body.tags || [],
    };

    try {
        console.log('Creating snippet');
        const { id } = await storage.create(snippet);
        res.json({ id });
    } catch (error) {
        console.error(error);
        res.status(201);
        res.json({ error: 'Unable to create snippet' });
    }
});

app.put('/api/snippets/:id', async (req, res) => {
    const { id } = req.params;

    try {
        console.log('Validating snippet', req.body);
        assertIsSnippet(req.body);
    } catch (err) {
        res.json({ error: err.message });
        return;
    }

    const snippet = {
        title: req.body.title.trim(),
        content: req.body.content.trim(),
        tags: req.body.tags || [],
    };

    try {
        console.log('Updating snippet', id);
        await storage.update(id, snippet);
        res.json({ ok: true });
    } catch (error) {
        console.error(error);
        res.json({ error: 'Unable to update snippet' });
    }
});

app.delete('/api/snippets/:id', async (req, res) => {
    const { id } = req.params;

    try {
        console.log('Deleting snippet', id);
        await storage.delete(id);
        res.json({ ok: true });
    } catch (error) {
        console.error(error);
        res.json({ error: 'Unable to delete snippet' });
    }
});

app.use((req, res) => {
    console.log({ error: 'Not found', url: req.originalUrl });
    res.status(404);
    res.json({ error: 'Not found' });
});

module.exports = app;
