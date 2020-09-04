import { expect } from '@snippet-store/common';
import assert from 'assert';

const toJSON = JSON.stringify;

const isNonEmptyString = (value: unknown): value is string =>
    expect.isStr(value) && value.length > 0;

export const assertIsStore = (store: any) => {
    assert(
        expect.isObj(store),
        `store should be an object, got ${toJSON(store)}`,
    );
    assert(
        isNonEmptyString(store.title),
        `store.title should be a non-empty string, got ${toJSON(store.title)}`,
    );
    assert(
        expect.isStr(store.description),
        `store.description should be a string, got ${toJSON(store.content)}`,
    );
};

export const assertIsSnippet = (snippet: any) => {
    assert(
        expect.isObj(snippet),
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
        expect.isArrOf(snippet.tags, isNonEmptyString),
        `snippet.tags should be an array of non-empty strings, got ${toJSON(
            snippet.tags,
        )}`,
    );
};
