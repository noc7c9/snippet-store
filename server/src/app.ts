import { logger } from '@snippet-store/common';
import assert from 'assert';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import morgan from 'morgan';

import * as config from './config';
import * as controllers from './controllers';

const log = logger('APP');

log('Loaded Config:', JSON.stringify(config));

const app = express();

app.use(morgan(config.NODE_ENV === 'development' ? 'dev' : 'combined'));
app.use(bodyParser.json());

// Necessary during development because ports are different
if (config.NODE_ENV === 'development') {
    log('Enabling CORS');
    app.use(cors());
}

const errorWrapper = (
    wrapper: (req: express.Request, res: express.Response) => void,
) => async (req: express.Request, res: express.Response) => {
    try {
        await wrapper(req, res);
    } catch (error) {
        log.error(error);
        res.status(400);
        res.json({ error: error.message });
    }
};

app.get('/api/stores', errorWrapper(controllers.listStores));

app.post('/api/stores', errorWrapper(controllers.createStore));
app.get('/api/stores/:storeId', errorWrapper(controllers.fetchStore));
app.put('/api/stores/:storeId', errorWrapper(controllers.updateStore));

app.get(
    '/api/stores/:storeId/snippets',
    errorWrapper(controllers.listSnippets),
);

app.post(
    '/api/stores/:storeId/snippets',
    errorWrapper(controllers.createSnippet),
);
app.put(
    '/api/stores/:storeId/snippets/:id',
    errorWrapper(controllers.updateSnippet),
);

app.delete(
    '/api/stores/:storeId/snippets/:id',
    errorWrapper(controllers.deleteSnippet),
);

app.use((req, res) => {
    log.error({ error: 'Not found', url: req.originalUrl });
    res.status(404);
    res.json({ error: 'Not found' });
});

export default app;
