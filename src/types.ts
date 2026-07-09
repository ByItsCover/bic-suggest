export type CoverResult = {
    cover_id: bigint,
    book_id: bigint,
    isbn_13: string,
    cover_url: string,
    _distance: number | null,
};

export type UserAttributes = {
    username: string;
    email: string;
    uid: string;
};
