import assert from 'assert';

export const notNull = <T>(value: T | null | undefined): T => {
    assert(value != null, `Value is null or undefined`);
    return value;
};

export const isObj = (value: unknown): value is Object =>
    Object.prototype.toString.call(value) === '[object Object]';

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
