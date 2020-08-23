require('dotenv').config();

exports.NODE_ENV = process.env.NODE_ENV;

exports.ROUTE_PREFIX = process.env.ROUTE_PREFIX;

exports.PORT = process.env.PORT;
exports.STORAGE = process.env.STORAGE;

exports.DYNAMODB_TABLE = process.env.DYNAMODB_TABLE;