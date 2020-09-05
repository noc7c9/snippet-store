import { loremIpsum } from 'lorem-ipsum';
import uuid from 'uuid';

type Range = [number] | [number, number];

const randomInt = ([min, max]: Range) => {
    if (max == null) return min;
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

const randomChoice = <T>(choices: T[]): T =>
    choices[randomInt([0, choices.length - 1])];

const randomWords = (range: Range) =>
    loremIpsum({ count: randomInt(range), units: 'words' });

type RandomSnippet = {
    title: Range;
    content: Range;
    numTags: Range;
    tagPool: string[];
};
const randomSnippet = ({
    title,
    content,
    numTags,
    tagPool,
}: RandomSnippet) => ({
    title: randomWords(title),
    content: randomWords(content),
    tags: Array.from(Array(randomInt(numTags)), () => randomChoice(tagPool)),
});

type RandomStore = {
    title: Range;
    description: Range;
    numTotalTags: Range;
    numSnippets: Range;
    snippetConfig: Omit<RandomSnippet, 'tagPool'>;
};
const randomStore = ({
    title,
    description,
    numTotalTags,
    numSnippets,
    snippetConfig,
}: RandomStore) => {
    const tagPool = randomWords(numTotalTags).split(' ');
    return {
        title: randomWords(title),
        description: randomWords(description),
        snippets: Array.from(Array(randomInt(numSnippets)), () =>
            randomSnippet({ ...snippetConfig, tagPool }),
        ),
    };
};

export default ({
    numStores,
    storeConfig,
    snippetConfig,
}: {
    numStores: Range;
    storeConfig: Omit<RandomStore, 'snippetConfig'>;
    snippetConfig: Omit<RandomSnippet, 'tagPool'>;
}) =>
    Array.from(Array(randomInt(numStores)), () =>
        randomStore({ ...storeConfig, snippetConfig }),
    );
