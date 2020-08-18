const config = require('./config');
const createApp = require('./create-app');

const main = async () => {
    const app = await createApp();

    app.listen(config.PORT, () => {
        console.log(`Listening on port ${config.PORT}`);
    });
};

main().catch(console.error);
