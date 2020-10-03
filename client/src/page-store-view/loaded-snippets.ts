import { expect, types, logger } from '@snippet-store/common';
import Fuse from 'fuse.js';
import * as localStorage from '../utils/local-storage';

const log = logger('PAGE::Store-View::Loaded-Snippets');

type Result = { snippet: types.Snippet; score: number; hidden: boolean };
type SortBy = 'title' | 'copyCount';

export type LoadedSnippets = {
    storeId: string;
    map: Record<string, Result>;
    fuse: Fuse<types.Snippet>;
    activeQuery: string | null;
    activeSortBy: SortBy;

    init: (snippets?: types.Snippet[]) => void;

    upsert: (snippet: types.Snippet) => void;
    get: (id: string) => types.Snippet | null;

    search: (query: string) => void;
    sortBy: (newSort?: SortBy) => SortBy;

    asArray: () => Result[];
};

const FUSE_OPTIONS = {
    includeScore: true,
    // includeMatches: true,
    shouldSort: true,
    findAllMatches: true,
    keys: [
        { name: 'title', weight: 0.7 },
        { name: 'content', weight: 0.4 },
    ],
    ignoreLocation: true,
    useExtendedSearch: true,
};

export default (storeId: string): LoadedSnippets => {
    const instance: LoadedSnippets = {
        storeId,
        map: {},
        fuse: new Fuse([], FUSE_OPTIONS),
        activeQuery: null,
        activeSortBy: 'copyCount',

        /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment */
        init: null as any,

        upsert: null as any,
        get: null as any,

        search: null as any,
        sortBy: null as any,

        asArray: null as any,
        /* eslint-enable */
    };
    return Object.assign(instance, {
        init: init(instance),

        upsert: upsert(instance),
        get: get(instance),

        search: search(instance),
        sortBy: sortBy(instance),

        asArray: asArray(instance),
    });
};

const init = (instance: LoadedSnippets) => (snippets: types.Snippet[] = []) => {
    log('initializing');

    snippets.forEach((snippet) => {
        instance.map[snippet.id] = { snippet, hidden: false, score: Infinity };
    });

    instance.fuse.setCollection(snippets);
};

const upsert = (instance: LoadedSnippets) => (snippet: types.Snippet) => {
    log('upsert:', snippet.id);

    if (snippet.id in instance.map) {
        instance.map[snippet.id].snippet = snippet;
    } else {
        instance.map[snippet.id] = { snippet, hidden: false, score: Infinity };
    }

    instance.fuse.remove((doc) => {
        // see: https://github.com/krisk/Fuse/pull/484
        if (doc == null) {
            return false;
        }
        return doc.id === snippet.id;
    });
    instance.fuse.add(snippet);
};

const get = (instance: LoadedSnippets) => (
    id: string,
): types.Snippet | null => {
    log('get:', id);
    return (instance.map[id] || null)?.snippet;
};

const search = (instance: LoadedSnippets) => (rawQuery: string): void => {
    const query = rawQuery.trim();

    if (query === '') {
        log('clear search');
        instance.activeQuery = query;

        // Reset results
        Object.keys(instance.map).forEach((id) => {
            instance.map[id].hidden = false;
            instance.map[id].score = Infinity;
        });

        return;
    }

    log('search:', query);

    // Hide all snippets
    Object.keys(instance.map).forEach((id) => {
        instance.map[id].hidden = true;
    });

    // Unhide and score matches
    const tags: string[] = [];
    const nonTags: string[] = [];
    (query.match(/([^#\s]+|#[^\s]+)/g) || []).forEach((term) => {
        if (term.startsWith('#')) {
            tags.push(term.substr(1));
        } else {
            nonTags.push(term);
        }
    });

    const nonTagMatches =
        nonTags.length === 0
            ? Object.values(instance.map).map(({ snippet }) => ({
                  item: snippet,
                  score: 1,
              }))
            : instance.fuse.search(nonTags.join(' '));

    const matches =
        tags.length === 0 ? nonTagMatches : tagSearch(nonTagMatches, tags);

    matches.forEach(({ item: { id }, score }) => {
        instance.map[id].hidden = false;
        instance.map[id].score = expect.notNull(score);
    });
};

const tagSearch = (
    candidates: { item: types.Snippet; score?: number }[],
    searchedTags: string[],
) => {
    // To be a match, the snippet must have every searched tag
    return candidates.filter((candidate) =>
        searchedTags.every((tag) => candidate.item.tags.includes(tag)),
    );
};

const sortBy = (instance: LoadedSnippets) => (newSortBy?: SortBy): SortBy => {
    log('sortBy:', newSortBy);
    if (newSortBy != null) {
        instance.activeSortBy = newSortBy;
    }
    return instance.activeSortBy;
};

type SortCmp = (a: Result, b: Result) => number;

const asArray = (instance: LoadedSnippets) => (): Result[] => {
    log('asArray');

    const array = Object.values(instance.map);
    let sortCmp: SortCmp = sortByCopyCount;
    if (instance.activeQuery != null) {
        sortCmp = sortByScore;
    } else if (instance.activeSortBy === 'title') {
        sortCmp = sortByTitle;
    }
    array.sort(sortByPinning(instance.storeId, sortCmp));
    return array;
};

const sortByPinning = (storeId: string, cmp: SortCmp): SortCmp => {
    const isPinned = localStorage.getPinData(storeId);
    return (a, b) => {
        const aPinned = isPinned(a.snippet.id);
        const bPinned = isPinned(b.snippet.id);
        if (aPinned && !bPinned) return -1;
        if (!aPinned && bPinned) return 1;
        return cmp(a, b);
    };
};

const sortByScore: SortCmp = (a, b) => {
    if (a.score === b.score) return sortByTitle(a, b);
    return a.score - b.score;
};

const sortByTitle: SortCmp = (a, b) => {
    if (a.snippet.title < b.snippet.title) return -1;
    if (a.snippet.title > b.snippet.title) return 1;
    return 0;
};

const sortByCopyCount: SortCmp = (a, b) => {
    if (a.snippet.copyCount === b.snippet.copyCount) return sortByTitle(a, b);
    return b.snippet.copyCount - a.snippet.copyCount;
};
