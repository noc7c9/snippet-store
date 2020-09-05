export function byId<E extends HTMLElement>(id: string): E {
    const elem = document.getElementById(id);
    if (elem == null) {
        throw new Error(`Failed to select element with "#${id}"`);
    }
    return elem as E;
}

export function one<E extends HTMLElement>(selector: string): E;
export function one<E extends HTMLElement>(
    element: HTMLElement,
    selector: string,
): E;
export function one<E extends HTMLElement>(
    elementOrSelector: HTMLElement | string,
    maybeSelector?: string,
): E {
    const [ctx, selector] =
        maybeSelector == null
            ? [document, elementOrSelector as string]
            : [elementOrSelector as HTMLElement, maybeSelector as string];
    const elem = ctx.querySelector(selector);
    if (elem == null) {
        throw new Error(`Failed to select element with "${selector}"`);
    }
    return elem as E;
}

export function all<E extends HTMLElement>(selector: string): E[];
export function all<E extends HTMLElement>(
    element: HTMLElement,
    selector: string,
): E[];
export function all<E extends HTMLElement>(
    elementOrSelector: HTMLElement | string,
    maybeSelector?: string,
): E[] {
    const [ctx, selector] =
        maybeSelector == null
            ? [document, elementOrSelector as string]
            : [elementOrSelector as HTMLElement, maybeSelector as string];
    return Array.from(ctx.querySelectorAll(selector));
}

export const on = (target: Element, event: string, handler: EventListener) => {
    target.addEventListener(event, handler);
};
export const off = (target: Element, event: string, handler: EventListener) => {
    target.removeEventListener(event, handler);
};

export const frag = <E extends HTMLElement>(html: string): E => {
    const template = document.createElement('template');
    template.innerHTML = html.trim();
    return template.content.firstChild as E;
};
