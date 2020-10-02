export type Store = {
    id: string;
    title: string;
    description: string;
};
export type StorePayload = Pick<Store, 'title' | 'description'>;

export type Snippet = {
    id: string;
    title: string;
    content: string;
    tags: string[];
    copyCount: number;
};
export type SnippetPayload = Pick<Snippet, 'title' | 'content' | 'tags'>;
