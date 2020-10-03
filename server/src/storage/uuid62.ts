import * as uuid from 'uuid';
import baseX from 'base-x';

const base62 = baseX(
    '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
);

export default (): string => {
    const buffer = Buffer.alloc(16);
    uuid.v4({}, buffer);
    const encoded = base62.encode(buffer);
    const id = encoded.length < 22 ? `0${encoded}` : encoded;
    return id;
};
