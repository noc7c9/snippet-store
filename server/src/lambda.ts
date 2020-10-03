import awsServerlessExpress from 'aws-serverless-express';
import app from './app';

const server = awsServerlessExpress.createServer(app);

type Args = Parameters<typeof awsServerlessExpress.proxy>;
export const handler = (event: Args[1], context: Args[2]): void => {
    awsServerlessExpress.proxy(server, event, context);
};
