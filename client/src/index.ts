import './utils/shitty-auto-reload';

import './index.scss';

import * as $ from './utils/$';
import * as router from './utils/router';
import renderLanding from './page-landing';
import renderStoreView from './page-store-view';

// The root element of the app
const root = $.one('#root');

router.init([
    {
        pattern: /^\/stores\/(?<id>[0-9a-zA-Z-]+)$/,
        render: ({ path, reroute }) => reroute(`${path}/snippets`),
    },

    {
        pattern: /^\/stores\/(?<id>[0-9a-zA-Z-]+)\/snippets$/,
        render: ({ params }) => renderStoreView(root, params as any),
    },

    {
        pattern: /^\/$/,
        render: () => renderLanding(root),
    },

    // No matches, so redirect to /
    {
        pattern: /.*/,
        render: ({ reroute }) => reroute('/'),
    },
]);
