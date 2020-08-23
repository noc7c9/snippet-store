import $ from 'jquery';
import clipboard from 'clipboard-polyfill';
import Tagify from 'bulma-tagsinput/dist/bulma-tagsinput';
import Fuse from 'fuse.js';

import * as config from './config';
import * as api from './api';
import snippetTemplate from './views/snippet.pug';

import './index.scss';

console.log('Loaded Config:', config);

const FUSE_OPTIONS = {
    tokenize: true,
    matchAllTokens: true,
    includeScore: true,
    threshold: 0.1,
    location: 0,
    distance: 100,
    maxPatternLength: 32,
    minMatchCharLength: 3,
    id: 'id',
    keys: [
        { name: 'tags', weight: 0.5 },
        { name: 'title', weight: 0.4 },
        { name: 'content', weight: 0.1 },
    ],
};

const $search = $('.search-input');

const $errorMsg = $('.error-msg');

const $snippetEditModal = $('#edit-modal');
const $titleInput = $('.title-input');
const $contentInput = $('.content-input');
const $tagsInput = $('.tags-input');
const tagified = new Tagify($tagsInput.get(0));
let editingSnippet = null;

const $confirmDeleteModal = $('#confirm-delete-modal');

function updateModalValidityStatus() {
    const isTitleEmpty = !$titleInput.get(0).value.trim();
    const isContentEmpty = !$contentInput.get(0).value.trim();
    const isDisabled = isTitleEmpty || isContentEmpty;

    $titleInput.toggleClass('is-danger', isTitleEmpty);
    $contentInput.toggleClass('is-danger', isContentEmpty);

    $snippetEditModal.find('.save-button').attr('disabled', isDisabled);
}

function popUpErrorNotification(msg) {
    msg = msg || 'Error! Please try again.';
    $errorMsg.text(msg);

    $errorMsg.finish().show('fast').delay(3000).hide('fast');
}

function showModal(snippet) {
    console.log('Show', snippet);
    snippet = snippet || {};
    const title = snippet.title || '';
    const content = snippet.content || '';
    const tags = snippet.tags || [];

    editingSnippet = snippet.id || null;

    $titleInput.get(0).value = title;
    $contentInput.get(0).value = content;

    // simply setting value doesn't work
    $(tagified.container).find('.control').remove();
    tagified.reset();
    tagified.setValue(tags);

    if (editingSnippet) {
        $snippetEditModal.find('.delete-button').show();
    } else {
        $snippetEditModal.find('.delete-button').hide();
    }

    updateModalValidityStatus();

    $snippetEditModal.addClass('is-active');

    // focus title input on show
    $titleInput.focus();
}

function updateSnippet(id, data) {
    const $snippet = $(`#${id}`);
    $snippet.find('.title').text(data.title);
    $snippet.find('.content').text(data.content);

    const $tags = $snippet.find('.tags');
    $tags.empty();
    for (let t of data.tags) {
        const $a = $('<a>');
        $a.text('#' + t);
        $tags.append($a);
    }
}

// initialize confirm delete modal
$confirmDeleteModal
    .on('click', '.modal-close, .delete-no-button', () => {
        $confirmDeleteModal.removeClass('is-active');
    })
    .on('click', '.delete-yes-button', () => {
        console.log('Deleting', { id: editingSnippet });

        const id = editingSnippet;

        const $yesButton = $('.delete-yes-button');
        $yesButton.addClass('is-loading');

        api.remove(id)
            .then(({ error }) => {
                $yesButton.removeClass('is-loading');

                if (error != null) {
                    console.error(error);
                    popUpErrorNotification(
                        'Error: Unable to delete snippet, please try again.',
                    );
                    return;
                }

                console.log('Deleted', id);

                $confirmDeleteModal.removeClass('is-active');
                $yesButton.text('Yes');

                $snippetEditModal.removeClass('is-active');

                $(`#${id}`).remove();
            })
            .catch((error) => {
                console.error(error);
                $yesButton.removeClass('is-loading');
                popUpErrorNotification(
                    'Error: Unable to delete snippet, please try again.',
                );
            });
    });

// initialize snippet modal
$('.add-new-button').on('click', () => {
    showModal();
});
$snippetEditModal
    .on('click', '.modal-close, .cancel-button', () => {
        $snippetEditModal.removeClass('is-active');
    })
    .on('click', '.save-button', function () {
        // ignore if disabled
        if ($(this).attr('disabled')) {
            return;
        }

        const snippet = {
            title: $titleInput.get(0).value.trim(),
            content: $contentInput.get(0).value.trim(),
            tags: tagified.tags.filter((v) => v),
        };

        const $saveButton = $('.save-button');
        $saveButton.addClass('is-loading');

        if (editingSnippet) {
            console.log('Updating', editingSnippet, snippet);

            const id = editingSnippet;
            snippet.id = id;

            api.update(snippet.id, snippet)
                .then(({ error }) => {
                    $saveButton.removeClass('is-loading');

                    if (error != null) {
                        console.error(error);
                        popUpErrorNotification(
                            'Error: Unable to edit snippet, please try again.',
                        );
                        return;
                    }

                    console.log('Updated', id);

                    $snippetEditModal.removeClass('is-active');
                    updateSnippet(editingSnippet, snippet);
                })
                .catch((error) => {
                    console.error(error);
                    $saveButton.removeClass('is-loading');
                    popUpErrorNotification(
                        'Error: Unable to edit snippet, please try again.',
                    );
                });
        } else {
            console.log('Creating', snippet);

            api.create(snippet)
                .then(({ id, error }) => {
                    $saveButton.removeClass('is-loading');

                    if (error != null) {
                        console.error(error);
                        popUpErrorNotification(
                            'Error: Unable to create snippet, please try again.',
                        );
                        return;
                    }

                    console.log('Created', id);

                    $snippetEditModal.removeClass('is-active');
                    snippet.id = id;
                    const html = snippetTemplate(snippet);
                    const $snippet = $.parseHTML(html);
                    $('.snippets').prepend($snippet);
                })
                .catch((error) => {
                    console.error(error);
                    $saveButton.removeClass('is-loading');
                    popUpErrorNotification(
                        'Error: Unable to create snippet, please try again.',
                    );
                });
        }
    })
    .on('click', '.delete-button', () => {
        $confirmDeleteModal.addClass('is-active');
    })
    .on('input', '.title-input, .content-input', () => {
        updateModalValidityStatus();
    });

// setup click handlers
$('.snippets')
    .on('click', '.copy-button', function (evt) {
        const content = $(this).siblings('p').text();
        clipboard
            .writeText(content)
            .then(() => {
                $(this).addClass('copy-success').text('Copied!');
            })
            .catch(() => {
                $(this).text('ERROR: Failed to Copy.');
            });
    })
    .on('mouseover', '.copy-button', function (evt) {
        $(this).removeClass('copy-success').text('Click to Copy');
    })
    .on('click', '.edit-button', function (evt) {
        const $snippet = $(this).parents('.snippet');
        const snippet = {
            id: $snippet.attr('id'),
            title: $snippet.find('.title').text(),
            content: $snippet.find('.content').text(),
            tags: $snippet
                .find('.tags')
                .text()
                .split('#')
                .filter((v) => v),
        };
        showModal(snippet);
    })
    .on('click', '.tags > a', function (evt) {
        const tag = $(this).text().replace('#', '');
        $search.attr('value', tag);
        $search.trigger('input');
    });

$search.on('input', () => {
    const $allSnippets = $('.snippets > .snippet');
    const query = $search.get(0).value.trim();

    if (!query) {
        $allSnippets.show();
        return;
    }

    const snippets = $allSnippets
        .map(function () {
            const $snippet = $(this);
            return {
                id: $snippet.attr('id'),
                title: $snippet.find('.title').text(),
                content: $snippet.find('.content').text(),
                tags: $snippet
                    .find('.tags')
                    .text()
                    .split('#')
                    .filter((v) => v),
            };
        })
        .get();

    const fuse = new Fuse(snippets, FUSE_OPTIONS);

    const matches = {};
    for (let { item } of fuse.search(query)) {
        matches[item] = true;
    }

    $allSnippets.each(function () {
        if (matches[this.id]) {
            $(this).show();
        } else {
            $(this).hide();
        }
    });
});

// load existing snippets
console.log('Loading snippets');
api.list().then(async ({ snippets }) => {
    console.log('Loaded snippets', snippets);
    snippets.forEach((snippet) => {
        const html = snippetTemplate(snippet);
        const $snippet = $.parseHTML(html);
        $('.snippets').append($snippet);
    });
});
