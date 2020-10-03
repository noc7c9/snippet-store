export default (string: string): string =>
    string
        .replace(/[^0-9a-zA-Z]+/g, '-')
        .replace(/^-|-$/g, '')
        .toLowerCase();
