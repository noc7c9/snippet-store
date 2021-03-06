import 'dotenv-safe/config';

export const NODE_ENV = process.env.NODE_ENV;

export const PORT = process.env.PORT || 3000;
export const STORAGE = process.env.STORAGE;

export const DYNAMODB_TABLE = process.env.DYNAMODB_TABLE;
