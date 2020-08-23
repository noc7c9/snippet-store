const config = require('./config');
const app = require('./app');

app.listen(config.PORT, () => {
    console.log(`Listening on port ${config.PORT}`);
});
