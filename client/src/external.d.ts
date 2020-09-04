declare module '*.pug' {
    function template(locals?: Record<string, unknown>): string;
    export default template;
}

declare module '@creativebulma/bulma-tagsinput' {
    class BulmaTagsInput {
        constructor(elem: HTMLInputElement, opts?: Record<string, any>);

        input: HTMLInputElement;
        selected: string | null;

        items: string[];

        add(tag: string): void;
        removeAtIndex(index: number): void;
        removeAll(): void;
    }

    export default BulmaTagsInput;
}
