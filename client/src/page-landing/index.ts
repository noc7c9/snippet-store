import { logger, sluggify } from '@snippet-store/common';

import * as $ from '../utils/$';
import * as router from '../utils/router';
import api from '../utils/api';
import createModal from '../utils/create-modal';
import * as localStorage from '../utils/local-storage';

import './index.scss';
import template from './index.pug';
import templateStoreList from './store-list.pug';
import templateModalCreateNewStore from './modal-create-new-store.pug';

const log = logger('PAGE::Landing');

export default (root: HTMLElement) => {
    root.innerHTML = template();

    {
        log('Loading recent stores');

        const stores = localStorage.getAllRecentStores();

        if (stores.length === 0) {
            log('Found no recent stores');
            $.one('#recent-no-results').classList.remove('is-hidden');
        } else {
            log('Found', stores.length, 'recent stores');
            const recent = $.one('#recent');
            recent.innerHTML = templateStoreList({
                stores: stores.map((store) => ({
                    href: `/#/stores/${store.id}/snippets`,
                    ...store,
                })),
            });
        }
    }

    // (async () => {
    //     const popular = $.one('#popular');
    //     const res = await api.store.list({ first: 8 });

    //     popular.classList.remove('is-spinner');

    //     if ('error' in res) {
    //         const elem = $.one('#popular-error');
    //         elem.classList.remove('is-hidden');
    //         elem.textContent = `Error: ${res.error}`;
    //         return;
    //     }

    //     const { stores } = res;

    //     if (stores.length === 0) {
    //         $.one('#popular-no-results').classList.remove('is-hidden');
    //         return;
    //     }

    //     popular.innerHTML = templateStoreList({
    //         stores: stores.map((store) => ({
    //             href: `/#/stores/${store.id}/snippets`,
    //             ...store,
    //         })),
    //     });
    // })();

    {
        log('Setting up Create-New-Store modal');

        const modal = createModal({
            template: templateModalCreateNewStore,
        });
        const elems = {
            error: $.one<HTMLElement>(modal, '#notify-error'),
            title: $.one<HTMLInputElement>(modal, '#input-title'),
            id: $.one<HTMLInputElement>(modal, '#input-id'),
            desc: $.one<HTMLTextAreaElement>(modal, '#input-desc'),
            submit: $.one<HTMLButtonElement>(modal, '#input-submit'),
        };

        root.append(modal);

        $.on($.one('#create-new-store'), 'click', () => {
            elems.title.value = '';
            elems.id.value = '';
            elems.desc.value = '';
            elems.submit.classList.remove('is-loading');
            elems.error.classList.add('is-hidden');

            modal.show();
            elems.title.focus();
        });

        $.on(modal, 'input', (e) => {
            const isFormValid = elems.title.value.trim().length > 0;
            elems.submit.disabled = !isFormValid;
        });

        $.on(elems.title, 'input', () => {
            elems.id.value = sluggify(elems.title.value);
        });

        $.on(elems.submit, 'click', async () => {
            const store = {
                title: elems.title.value.trim(),
                description: elems.desc.value.trim(),
            };
            log('event click: create', store);

            elems.submit.classList.add('is-loading');
            const res = await api.store.create(store);
            elems.submit.classList.remove('is-loading');

            if ('error' in res) {
                log('failed to create store:', res.error);
                elems.error.classList.remove('is-hidden');
                elems.error.textContent = `Error: ${res.error}`;
                return;
            }

            log('created new store:', res.id);
            router.goto(`/stores/${res.id}/snippets`);
        });
    }
};
