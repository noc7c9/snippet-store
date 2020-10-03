import { logger } from '@snippet-store/common';

const log = logger('ROUTER');

type Handler = (args: {
    path: string;
    params?: Record<string, string>;
    reroute: (path: string) => void;
}) => void;
type Route = {
    pattern: RegExp;
    render: Handler;
};

export const init = (routes: Route[]): void => {
    // Ensure we're on the root page
    if (location.pathname !== '/') {
        log.warn('Redirecting to root page');
        location.href = '/';
        return;
    }

    log('Initialising router');

    window.addEventListener('hashchange', () => {
        log('event hashchange:', 're-routing', location.hash);
        route(routes);
    });

    route(routes);
};

const route = (routes: Route[]) => {
    const path = location.hash.substr(1);
    for (let i = 0; i < routes.length; i++) {
        const { pattern, render } = routes[i];
        const match = pattern.exec(path);
        if (match != null) {
            log('match:', pattern);
            const params = match.groups;
            const reroute = (newPath: string) => {
                log('reroute:', newPath);
                history.replaceState(null, '', `/#${newPath}`);
                route(routes);
            };
            render({ path, params, reroute });
            break;
        }
    }
};

export const goto = (route: string): void => {
    log('goto:', route);
    location.hash = route;
};
