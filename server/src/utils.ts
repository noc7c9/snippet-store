import { expect, types } from '@snippet-store/common';
import assert from 'assert';

const toJSON = JSON.stringify;

const isNonEmptyString = (value: unknown): value is string =>
    expect.isStr(value) && value.length > 0;

export const assertIsStore = (store: unknown): Omit<types.Store, 'id'> => {
    assert(
        expect.isObj(store),
        `store should be an object, got ${toJSON(store)}`,
    );

    const { title, description } = store;
    assert(
        isNonEmptyString(title),
        `store.title should be a non-empty string, got ${toJSON(title)}`,
    );
    assert(
        expect.isStr(description),
        `store.description should be a string, got ${toJSON(description)}`,
    );

    return { title, description };
};

export const assertIsSnippet = (
    snippet: unknown,
): Omit<types.Snippet, 'id'> => {
    assert(
        expect.isObj(snippet),
        `snippet should be an object, got ${toJSON(snippet)}`,
    );

    const { title, content, tags, copyCount } = snippet;
    assert(
        isNonEmptyString(title),
        `snippet.title should be a non-empty string, got ${toJSON(title)}`,
    );
    assert(
        isNonEmptyString(content),
        `snippet.content should be a non-empty string, got ${toJSON(content)}`,
    );
    assert(
        expect.isArrOf(tags, isNonEmptyString),
        `snippet.tags should be an array of non-empty strings, got ${toJSON(
            tags,
        )}`,
    );
    assert(
        expect.isNum(copyCount),
        `snippet.copyCount should be a number, got ${toJSON(copyCount)}`,
    );

    return { title, content, tags, copyCount };
};
