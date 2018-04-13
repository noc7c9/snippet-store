const express = require('express');
const {MongoClient, ObjectID} = require('mongodb');
const bodyParser = require('body-parser');

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI
    || 'mongodb://localhost:27017/snippet-store';

const app = express();

app.set('view engine', 'pug');

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true, }));

MongoClient.connect(MONGODB_URI, (err, client) => {
    if (err) {
        throw err;
    }

    const db = client.db();
    const snippets = db.collection('snippets');

    console.log(`Connected to mongo database. (${MONGODB_URI})`);

    app.get('/', (req, res) => {
        snippets.find({}).toArray((err, snippets) => {
            res.render('index', {
                snippets: snippets || [],
            });
        });
    });

    app.post('/api/read', (req, res) => {
        snippets.find({}).toArray((err, snippets) => {
            res.json(snippets);
        });
    });

    app.post('/api/update', (req, res) => {
        const id = new ObjectID(req.body.id);
        const snippet = {
            title: req.body.title.trim(),
            content: req.body.content.trim(),
            tags: req.body.tags || [],
        };
        if (id && snippet.title && snippet.content) {
            snippets.findOneAndReplace({_id: id}, snippet, (err, result) => {
                if (err) {
                    res.send('ERR: ' + err);
                } else {
                    console.log('UPDATE:', id, snippet);
                    res.send('OK');
                }
            });
        } else {
            res.send('ERR: Missing title/content');
        }
    });

    app.post('/api/create', (req, res) => {
        const snippet = {
            title: req.body.title.trim(),
            content: req.body.content.trim(),
            tags: req.body.tags || [],
        };
        if (snippet.title && snippet.content) {
            snippets.insert(snippet, (err, result) => {
                if (err) {
                    res.send('ERR: ' + err);
                } else {
                    console.log('CREATE:', snippet);
                    res.send(result.ops[0]._id);
                }
            });
        } else {
            res.send('ERR: Missing title/content');
        }
    });

    app.post('/api/delete', (req, res) => {
        const id = new ObjectID(req.body.id);
        snippets.findOneAndDelete({_id: id}, (err, result) => {
            console.log(err, result);
            if (err) {
                res.send('ERR: ' + err);
            } else {
                console.log('DELETE:', id);
                res.send('OK');
            }
        });
    });

    app.use(function (req, res) {
        res.status(404);
        res.render('404');
    });

    app.listen(PORT, () => {
        console.log(`Listening on port ${PORT}.`);
    });

});
