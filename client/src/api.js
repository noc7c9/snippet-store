import * as config from './config';

const url = (path) => `${config.API_URL}/api${path}`;

export const list = () =>
    fetch(url('/snippets'), {
        method: 'GET',
    }).then((res) => res.json());

export const create = (data) =>
    fetch(url('/snippets'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    }).then((res) => res.json());

export const update = (id, data) =>
    fetch(url(`/snippets/${id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    }).then((res) => res.json());

export const remove = (id) =>
    fetch(url(`/snippets/${id}`), {
        method: 'DELETE',
    }).then((res) => res.json());
