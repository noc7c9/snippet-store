import assert from 'assert';
import { logger } from '@snippet-store/common';

import * as config from '../config';
import { StorageAPI } from './types';

import storageInMemory from './in-memory';
import storageDynamoDb from './dynamodb';

const log = logger('STORAGE');

let storage: StorageAPI;

// In-Memory
if (config.STORAGE === 'in-memory') {
    const opts = { mock: 'medium' };
    log('Using In-Memory storage:', opts);
    storage = storageInMemory(opts);
}

// DynamoDB
else if (config.STORAGE === 'dynamodb') {
    assert(config.DYNAMODB_TABLE, 'DYNAMODB_TABLE env var is not set');
    console.log(`Using DynamoDB storage (${config.DYNAMODB_TABLE})`);
    storage = storageDynamoDb({ tableName: config.DYNAMODB_TABLE });
}

// Unknown
else {
    throw new Error(`Unknown env.STORAGE value: ${String(config.STORAGE)}`);
}

export default storage;
