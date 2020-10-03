// Helpers to make eslint shutup about non-standard promise uses

export const ignore = <T>(promise: Promise<T>): void => {
    promise.catch((e) => {
        // log and ignore any errors
        console.error('Ignored Promise Errored:', e);
    });
};

export const iife = (fn: () => Promise<void>): void => {
    ignore(fn());
};

export const cb = <Args extends unknown[]>(
    fn: (...args: Args) => Promise<void>,
): ((...args: Args) => void) => {
    return (...args) => ignore(fn(...args));
};
