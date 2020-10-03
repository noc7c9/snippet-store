export const notNull = <T>(value: T | null | undefined): T => {
    if (value == null) {
        throw new Error('Value is null or undefined');
    }
    return value;
};

export const isObj = (value: unknown): value is Record<string, unknown> =>
    Object.prototype.toString.call(value) === '[object Object]';

export const hasProp = <
    Obj extends Record<string, unknown>,
    P extends PropertyKey
>(
    obj: Obj,
    prop: P,
): obj is Obj & Record<P, unknown> =>
    Object.prototype.hasOwnProperty.call(obj, prop);

export const isArr = (value: unknown): value is unknown[] =>
    Array.isArray(value);

export const isArrOf = <T>(
    value: unknown,
    test: (v: unknown) => v is T,
): value is T[] => isArr(value) && value.every((v) => test(v));

export const isStr = (value: unknown): value is string =>
    typeof value === 'string';
export const isNum = (value: unknown): value is number =>
    typeof value === 'number';
export const isBool = (value: unknown): value is boolean =>
    typeof value === 'boolean';
