import { types, logger, expect } from '@snippet-store/common';
import BulmaTagsInput from '@creativebulma/bulma-tagsinput';

import * as $ from '../utils/$';
import * as router from '../utils/router';
import api from '../utils/api';
import createModal from '../utils/create-modal';

import './index.scss';
import template from './index.pug';
import templateSnippetList from './snippet-list.pug';
import templateModalCreateNewSnippet from './modal-create-new-snippet.pug';
import templateModalEditSnippet from './modal-edit-snippet.pug';

import makeLoadedSnippets, { LoadedSnippets } from './loaded-snippets';

const log = logger('PAGE::Store-View');

export default (root: HTMLElement, { id: storeId }: { id: string }) => {
    root.innerHTML = template();

    const snippets = $.one('#snippets');
    const loadedSnippets = makeLoadedSnippets();

    const renderSnippets = () => {
        snippets.innerHTML = templateSnippetList({
            results: loadedSnippets.asArray(),
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

    // Loading store data
    (async () => {
        const res = await api.store.fetch({ storeId });

        if ('error' in res) {
            return;
        }

        const elem = $.one('#title');
        elem.textContent = res.store.title;
    })();

    // Loading snippets
    (async () => {
        const res = await api.snippets.list({ storeId, first: 250 });

        snippets.classList.remove('is-spinner');

        if ('error' in res) {
            const elem = $.one('#snippets-error');
            elem.classList.remove('is-hidden');
            elem.textContent = `Error: ${res.error}`;
            return;
        }

        loadedSnippets.init(res.snippets);
        renderSnippets();
    })();

    // events on .copy-button
    {
        $.on(snippets, 'click', async (e) => {
            if (e.target == null) return;
            const elem = e.target as Element;

            if (!elem.matches('.copy-button')) {
                return;
            }
            e.preventDefault();

            const { id } = expect.notNull(elem.closest('.snippet'));
            log('event click: copy', id);

            try {
                const snippet = expect.notNull(loadedSnippets.get(id));
                await navigator.clipboard.writeText(snippet.content);
                elem.classList.add('copy-success');
            } catch (err) {
                elem.classList.add('copy-fail');
            }
        });

        $.on(snippets, 'mouseover', async (e) => {
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
        $.on(input, 'input', (e) => {
            clearTimeout(timeout);
            timeout = setTimeout(doSearch, DEBOUNCE);
        });

        $.on(snippets, 'click', async (e) => {
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

    $.on(elems.submit, 'click', async () => {
        const snippet = {
            title: elems.title.value.trim(),
            content: elems.content.value.trim(),
            tags: tagsInput.items,
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
    });
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

    $.on(snippets, 'click', async (e) => {
        if (e.target == null) return;
        const elem = e.target as Element;

        if (!elem.matches('.edit-button')) {
            return;
        }
        e.preventDefault();

        const { id } = elem.parentNode!.parentNode! as any;
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

    $.on(elems.submit, 'click', async () => {
        const id = editingId;
        const snippet = {
            id,
            title: elems.title.value.trim(),
            content: elems.content.value.trim(),
            tags: tagsInput.items,
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
    });
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
