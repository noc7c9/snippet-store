type LogFn = (...args: unknown[]) => void;

type Logger = LogFn & {
    warn: LogFn;
    error: LogFn;
};

export default (name: string): Logger => {
    const prefix = `[${name}]`;
    const info = (...args: unknown[]) => console.info(prefix, ...args);
    const warn = (...args: unknown[]) => console.warn(prefix, ...args);
    const error = (...args: unknown[]) => console.error(prefix, ...args);
    return Object.assign(info, { warn, error });
};
