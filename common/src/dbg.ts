type u = unknown;
export function dbg<T>(...args: [T]): T;
export function dbg<T>(...args: [u, T]): T;
export function dbg<T>(...args: [u, u, T]): T;
export function dbg<T>(...args: [u, u, u, T]): T;
export function dbg<T>(...args: [u, u, u, u, T]): T;
export function dbg<T>(...args: [u, u, u, u, u, T]): T;
export function dbg<T>(...args: [u, u, u, u, u, u, T]): T;
export function dbg<T>(...args: [u, u, u, u, u, u, u, T]): T;
export function dbg<T>(...args: [u, u, u, u, u, u, u, u, T]): T;
export function dbg<T>(...args: [u, u, u, u, u, u, u, u, u, T]): T;
export function dbg(...args: unknown[]) {
    console.log(...args);
    return args[args.length - 1];
}
