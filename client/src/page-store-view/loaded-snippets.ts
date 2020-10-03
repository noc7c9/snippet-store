import { types, logger } from '@snippet-store/common';
import Fuse from 'fuse.js';

const log = logger('PAGE::Store-View::Loaded-Snippets');

type Result = { snippet: types.Snippet; score: number; hidden: boolean };
type FuseResult = Fuse.FuseResult<types.Snippet>;
type SortBy = 'title' | 'copyCount';

export type LoadedSnippets = {
    map: Record<string, Result>;
    fuse: Fuse<types.Snippet>;
    activeQuery: string | null;
    activeSortBy: SortBy;
    cachedArray: Result[] | null;

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

export default () => {
    const instance: LoadedSnippets = {
        map: {},
        fuse: new Fuse([], FUSE_OPTIONS),
        activeQuery: null,
        activeSortBy: 'copyCount',
        cachedArray: null,

        init: null as any,

        upsert: null as any,
        get: null as any,

        search: null as any,
        sortBy: null as any,

        asArray: null as any,
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
    instance.cachedArray = null;

    snippets.forEach((snippet, idx) => {
        instance.map[snippet.id] = { snippet, hidden: false, score: Infinity };
    });

    instance.fuse.setCollection(snippets);
};

const upsert = (instance: LoadedSnippets) => (snippet: types.Snippet) => {
    log('upsert:', snippet.id);
    instance.cachedArray = null;

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
    instance.cachedArray = null;

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
        instance.map[id].score = score!;
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
        instance.cachedArray = null;
        instance.activeSortBy = newSortBy;
    }
    return instance.activeSortBy;
};

const asArray = (instance: LoadedSnippets) => (): Result[] => {
    log('asArray');
    if (instance.cachedArray == null) {
        instance.cachedArray = Object.values(instance.map);
        if (instance.activeQuery != null) {
            instance.cachedArray.sort(sortByScore);
        } else if (instance.activeSortBy === 'title') {
            instance.cachedArray.sort(sortByTitle);
        } else {
            instance.cachedArray.sort(sortByCopyCount);
        }
    }
    return instance.cachedArray;
};

const sortByScore = (a: Result, b: Result) => {
    if (a.score === b.score) return sortByTitle(a, b);
    return a.score - b.score;
};

const sortByTitle = (a: Result, b: Result) => {
    if (a.snippet.title < b.snippet.title) return -1;
    if (a.snippet.title > b.snippet.title) return 1;
    return 0;
};

const sortByCopyCount = (a: Result, b: Result) => {
    if (a.snippet.copyCount === b.snippet.copyCount) return sortByTitle(a, b);
    return b.snippet.copyCount - a.snippet.copyCount;
};
