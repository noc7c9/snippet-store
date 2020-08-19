const awsServerlessExpress = require('aws-serverless-express');
const createApp = require('./create-app');

let server = null;

exports.handler = async (event, context) => {
    if (server == null) {
        server = awsServerlessExpress.createServer(await createApp());
    }
    awsServerlessExpress.proxy(server, event, context);
};
