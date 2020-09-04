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

const log = logger('PAGE::Store-View');

export default (root: HTMLElement, { id: storeId }: { id: string }) => {
    root.innerHTML = template();

    let loadedSnippets: Record<string, types.Snippet> = {};
    const snippets = $.one('#snippets');

    const renderSnippets = () => {
        snippets.innerHTML = templateSnippetList({
            snippets: Object.values(loadedSnippets),
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

        if (res.snippets.length === 0) {
            $.one('#snippets-no-results').classList.remove('is-hidden');
            return;
        }

        res.snippets.forEach((snippet) => {
            loadedSnippets[snippet.id] = snippet;
        });

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
                await navigator.clipboard.writeText(loadedSnippets[id].content);
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
    loadedSnippets: Record<string, types.Snippet>;
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

        loadedSnippets[res.id] = { id: res.id, ...snippet };
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
    loadedSnippets: Record<string, types.Snippet>;
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

        const snippet = loadedSnippets[id];

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

        loadedSnippets[id] = snippet;
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
