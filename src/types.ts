export type CoverResult = {
    cover_id: bigint,
    book_id: bigint,
    isbn_13: string,
    cover_url: string,
    _distance: number | null,
};

export type UserResult = {
    user_id: string,
    tower_embedding: number[],
};

export type UserAttributes = {
    username: string;
    email: string;
    uid_hex: string;
};
