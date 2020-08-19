exports.PORT = process.env.PORT || 3000;
exports.STORAGE = process.env.STORAGE || 'in-memory';

exports.MONGODB_URI =
    process.env.MONGODB_URI || 'mongodb://localhost:27017/snippet-store';

exports.DYNAMODB_TABLE = process.env.DYNAMODB_TABLE;
