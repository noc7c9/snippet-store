import awsServerlessExpress from 'aws-serverless-express';
import app from './app';

const server = awsServerlessExpress.createServer(app);

type Args = Parameters<typeof awsServerlessExpress.proxy>;
exports.handler = (event: Args[1], context: Args[2]) => {
    awsServerlessExpress.proxy(server, event, context);
};
