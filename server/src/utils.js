const assert = require('assert');

const isObj = (value) =>
    Object.prototype.toString.call(value) === '[object Object]';
const isArrOf = (value, test) => Array.isArray(value) && value.every(test);

const toJSON = JSON.stringify;

const isNonEmptyString = (value) =>
    typeof value === 'string' && value.length > 0;

exports.assertIsSnippet = (snippet) => {
    assert(
        isObj(snippet),
        `snippet should be an object, got ${toJSON(snippet)}`,
    );
    assert(
        isNonEmptyString(snippet.title),
        `snippet.title should be a non-empty string, got ${toJSON(
            snippet.title,
        )}`,
    );
    assert(
        isNonEmptyString(snippet.content),
        `snippet.content should be a non-empty string, got ${toJSON(
            snippet.content,
        )}`,
    );
    assert(
        isArrOf(snippet.tags, isNonEmptyString),
        `snippet.tags should be an array of non-empty strings, got ${toJSON(
            snippet.tags,
        )}`,
    );
};
