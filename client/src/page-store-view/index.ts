import { logger, expect } from '@snippet-store/common';
import BulmaTagsInput from '@creativebulma/bulma-tagsinput';

import * as async from '../utils/async';
import * as $ from '../utils/$';
import api from '../utils/api';
import createModal from '../utils/create-modal';
import * as localStorage from '../utils/local-storage';

import './index.scss';
import template from './index.pug';
import templateSnippetList from './snippet-list.pug';
import templateModalCreateNewSnippet from './modal-create-new-snippet.pug';
import templateModalEditSnippet from './modal-edit-snippet.pug';

import makeLoadedSnippets, { LoadedSnippets } from './loaded-snippets';

const log = logger('PAGE::Store-View');

export default (root: HTMLElement, { id: storeId }: { id: string }): void => {
    root.innerHTML = template();

    const snippets = $.one('#snippets');
    const loadedSnippets = makeLoadedSnippets(storeId);

    const renderSnippets = () => {
        snippets.innerHTML = templateSnippetList({
            results: loadedSnippets.asArray(),
            isPinned: localStorage.getPinData(storeId),
        });
        refreshSnippets();
    };
    const refreshSnippets = () => {
        const results = loadedSnippets.asArray();

        $.one('#snippets-no-results').classList.toggle(
            'is-hidden',
            results.some(({ hidden }) => !hidden),
        );

        results.forEach(({ snippet, hidden }, index) => {
            const elem = $.byId(snippet.id);
            elem.style.order = index.toString();
            elem.style.display = hidden ? 'none' : '';
        });
    };

    const fetchStoreData = api.store.fetch({ storeId });
    const fetchSnippets = api.snippets.list({ storeId, first: 250 });

    // Main spinner
    async.iife(async () => {
        await fetchStoreData;
        await fetchSnippets;

        $.one('#main-spinner').classList.add('is-hidden');
        $.one('#main-content').classList.remove('is-hidden');
    });

    // Loading store data
    async.iife(async () => {
        const res = await fetchStoreData;

        if ('error' in res) {
            const elem = $.one('#page-error');
            elem.classList.remove('is-hidden');
            elem.textContent = `Error: ${res.error}`;
            return;
        }

        localStorage.addRecentStore(res.store);

        $.one('#title').textContent = res.store.title;
        $.one('#description').textContent = res.store.description;
    });

    // Loading snippets
    async.iife(async () => {
        const res = await fetchSnippets;

        snippets.classList.remove('is-spinner');

        if ('error' in res) {
            const elem = $.one('#snippets-error');
            elem.classList.remove('is-hidden');
            elem.textContent = `Error: ${res.error}`;
            return;
        }

        loadedSnippets.init(res.snippets);
        renderSnippets();
    });

    // propagated events on snippets
    {
        $.on(snippets, 'click', (e) => {
            if (e.target == null) return;
            const elem = e.target as Element;

            if (elem.matches('.copy-button')) {
                async.ignore(clickOnCopyButton(elem));
                e.preventDefault();
                return;
            }

            const pinButton = elem.closest('.pin-button');
            if (pinButton || elem.matches('.pin-button')) {
                clickOnPinButton(pinButton ?? elem);
                e.preventDefault();
                return;
            }
        });

        const clickOnCopyButton = async (elem: Element) => {
            const { id } = expect.notNull(elem.closest('.snippet'));
            log('event click: copy', id);

            try {
                const snippet = expect.notNull(loadedSnippets.get(id));
                await navigator.clipboard.writeText(snippet.content);
                elem.classList.add('copy-success');
            } catch (err) {
                elem.classList.add('copy-fail');
            }

            // We don't care if request succeeds or not
            async.ignore(api.snippets.incrementCopyCount({ id, storeId }));
        };

        const clickOnPinButton = (elem: Element) => {
            const { id } = expect.notNull(elem.closest('.snippet'));

            const isPinned = localStorage.togglePinned(storeId, id);
            elem.classList.toggle('is-active', isPinned);
            refreshSnippets();

            log('event click:', isPinned ? 'pin' : 'unpin', id);
        };

        $.on(snippets, 'mouseover', (e) => {
            if (e.target == null) return;
            const elem = e.target as Element;

            if (!elem.matches('.copy-button')) {
                return;
            }
            e.preventDefault();

            elem.classList.remove('copy-success');
            elem.classList.remove('copy-fail');
        });
    }

    // input events on .search-input and click events on .tags
    {
        const DEBOUNCE = 200;
        const input = $.one<HTMLInputElement>('#search-input');

        let timeout: ReturnType<typeof setTimeout>;
        $.on(input, 'input', () => {
            clearTimeout(timeout);
            timeout = setTimeout(doSearch, DEBOUNCE);
        });

        $.on(snippets, 'click', (e) => {
            if (e.target == null) return;
            const elem = e.target as Element;

            if (!elem.matches('.tags a')) {
                return;
            }
            e.preventDefault();

            const tag = elem.textContent;
            if (tag == null) {
                return;
            }

            if (!input.value.includes(tag)) {
                input.value = `${input.value} ${tag}`.trim();
                doSearch();
            }
        });

        const doSearch = () => {
            const query = input.value;
            loadedSnippets.search(query);
            refreshSnippets();
        };
    }

    // events on sort buttons
    {
        const sortAlphaButton = $.one<HTMLButtonElement>('#sort-alpha');
        const sortPopButton = $.one<HTMLButtonElement>('#sort-pop');

        const fixActiveButton = () => {
            if (loadedSnippets.sortBy() === 'title') {
                sortPopButton.classList.remove('is-active', 'is-primary');
                sortAlphaButton.classList.add('is-active', 'is-primary');
            } else {
                sortAlphaButton.classList.remove('is-active', 'is-primary');
                sortPopButton.classList.add('is-active', 'is-primary');
            }
        };

        fixActiveButton();

        $.on(sortAlphaButton, 'click', () => {
            if (loadedSnippets.sortBy() === 'title') return;

            log('event click: sort by title');

            loadedSnippets.sortBy('title');
            fixActiveButton();
            refreshSnippets();
        });

        $.on(sortPopButton, 'click', () => {
            if (loadedSnippets.sortBy() === 'copyCount') return;

            log('event click: sort by copy count');

            loadedSnippets.sortBy('copyCount');
            fixActiveButton();
            refreshSnippets();
        });
    }

    setupCreateNewSnippetModal({
        root,
        storeId,
        renderSnippets,
        loadedSnippets,
    });
    setupEditSnippetModal({
        root,
        snippets,
        storeId,
        renderSnippets,
        loadedSnippets,
    });
};

function setupCreateNewSnippetModal({
    root,
    storeId,
    renderSnippets,
    loadedSnippets,
}: {
    root: HTMLElement;
    storeId: string;
    renderSnippets: () => void;
    loadedSnippets: LoadedSnippets;
}) {
    const modal = createModal({ template: templateModalCreateNewSnippet });
    const elems = {
        error: $.one<HTMLElement>(modal, '#create-notify-error'),
        title: $.one<HTMLInputElement>(modal, '#create-input-title'),
        content: $.one<HTMLTextAreaElement>(modal, '#create-input-content'),
        tags: $.one<HTMLInputElement>(modal, '#create-input-tags'),
        submit: $.one<HTMLButtonElement>(modal, '#create-input-submit'),
    };
    const tagsInput = initialiseTagsInput(elems.tags);

    root.append(modal);

    $.on($.one('#create-new-snippet'), 'click', () => {
        elems.title.value = '';
        elems.content.value = '';
        tagsInput.removeAll();
        elems.submit.classList.remove('is-loading');
        elems.error.classList.add('is-hidden');

        modal.show();
        elems.content.focus();
    });

    $.on(
        elems.submit,
        'click',
        async.cb(async () => {
            const snippet = {
                title: elems.title.value.trim(),
                content: elems.content.value.trim(),
                tags: tagsInput.items,
                copyCount: 0,
            };

            // If snippet doesn't have a title set, create one from the content
            if (snippet.title === '') {
                snippet.title = titleFromContent(snippet.content);
            }

            log('event click: create', snippet);

            elems.submit.classList.add('is-loading');
            const res = await api.snippets.create({ storeId }, snippet);
            elems.submit.classList.remove('is-loading');

            if ('error' in res) {
                log('failed to create store:', res.error);
                elems.error.classList.remove('is-hidden');
                elems.error.textContent = `Error: ${res.error}`;
                return;
            }

            log('created new snippet:', res.id);

            loadedSnippets.upsert({ id: res.id, ...snippet });
            renderSnippets();

            modal.hide();
        }),
    );
}

function setupEditSnippetModal({
    root,
    snippets,
    storeId,
    renderSnippets,
    loadedSnippets,
}: {
    root: HTMLElement;
    snippets: HTMLElement;
    storeId: string;
    renderSnippets: () => void;
    loadedSnippets: LoadedSnippets;
}) {
    const modal = createModal({ template: templateModalEditSnippet });
    const elems = {
        error: $.one<HTMLElement>(modal, '#edit-notify-error'),
        title: $.one<HTMLInputElement>(modal, '#edit-input-title'),
        content: $.one<HTMLTextAreaElement>(modal, '#edit-input-content'),
        tags: $.one<HTMLInputElement>(modal, '#edit-input-tags'),
        submit: $.one<HTMLButtonElement>(modal, '#edit-input-submit'),
    };
    const tagsInput = initialiseTagsInput(elems.tags);

    root.append(modal);

    let editingId: string;

    $.on(snippets, 'click', (e) => {
        if (e.target == null) return;
        const elem = e.target as Element;

        if (!elem.matches('.edit-button')) {
            return;
        }
        e.preventDefault();

        const { id } = expect.notNull(elem.parentElement?.parentElement);
        editingId = id;

        log('event click: edit', id);

        const snippet = expect.notNull(loadedSnippets.get(id));

        elems.title.value = snippet.title;
        elems.content.value = snippet.content;
        tagsInput.removeAll();
        snippet.tags.forEach((tag) => tagsInput.add(tag));

        elems.submit.classList.remove('is-loading');
        elems.error.classList.add('is-hidden');

        modal.show();
        elems.content.focus();
    });

    $.on(
        elems.submit,
        'click',
        async.cb(async () => {
            const id = editingId;
            const snippet = {
                id,
                title: elems.title.value.trim(),
                content: elems.content.value.trim(),
                tags: tagsInput.items,
                copyCount: -1, // will be ignored by the update
            };

            // If snippet doesn't have a title set, create one from the content
            if (snippet.title === '') {
                snippet.title = titleFromContent(snippet.content);
            }

            log('event click: save', snippet);

            elems.submit.classList.add('is-loading');
            const res = await api.snippets.update({ id, storeId }, snippet);
            elems.submit.classList.remove('is-loading');

            if ('error' in res) {
                log('failed to create store:', res.error);
                elems.error.classList.remove('is-hidden');
                elems.error.textContent = `Error: ${res.error}`;
                return;
            }

            log('updating snippet:', id);

            loadedSnippets.upsert(snippet);
            renderSnippets();

            modal.hide();
        }),
    );
}

const FIRST_WORDS_COUNT = 7;
function titleFromContent(content: string) {
    const firstLine = content.trim().split('\n', 1)[0];
    const firstFewWords = firstLine
        .split(' ')
        .map((word) => word.trim())
        .filter((word) => word != '')
        .slice(0, FIRST_WORDS_COUNT);
    return firstFewWords.join(' ');
}

function initialiseTagsInput(elem: HTMLInputElement): BulmaTagsInput {
    const tagsInput = new BulmaTagsInput(elem, {
        clearSelectionOnTyping: true,
        delimiter: ' ',
    });

    // If user leaves incomplete value, use that as tag
    $.on(tagsInput.input, 'blur', () => {
        tagsInput.add(tagsInput.input.value);
        tagsInput.input.value = '';
    });

    // On backspace, delete the last tag even if it's not selected
    $.on(tagsInput.input, 'keydown', (e) => {
        if (
            (e as KeyboardEvent).code !== 'Backspace' ||
            tagsInput.input.value !== '' ||
            tagsInput.selected != null
        ) {
            return;
        }
        tagsInput.removeAtIndex(tagsInput.items.length - 1);
    });

    return tagsInput;
}
