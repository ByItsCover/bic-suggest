export enum Rating {
    "Dislike",
    "Like",
    "Love"
}

export type CoverResult = {
    cover_id: bigint,
    book_id: bigint,
    isbn_13: string,
    cover_url: string,
    _distance: number | null,
    rating: Rating | null,
};

export type UserResult = {
    user_id: string,
    tower_embedding: number[],
};

export type FeedbackResult = {
    cover_id: bigint,
    score: number,
};

export type UserAttributes = {
    username: string;
    email: string;
    uid_hex: string;
};

export type TablePair = {
    var_name: string;
    table_name: string;
};
