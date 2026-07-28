export enum Rating {
    "Dislike",
    "Neutral",
    "Like",
    "Love"
}

export type CoverRating = {
    cover_id: number,
    score: Rating,
}

export type CoverResult = {
    cover_id: bigint,
    book_id: bigint,
    isbn_13: string,
    cover_url: string,
    _distance: number | null,
    rating: Rating | null,
};

export enum Feedback {
    "Rating",
}

export type FeedbackUpload = {
    user_id: Uint8Array,
    cover_id: number,
    type: string,
    score: number,
    timestamp: number,
}

export type FeedbackResult = {
    cover_id: bigint,
    score: bigint,
};

export type UserUpload = {
    user_id: Uint8Array,
};

export type UserResult = {
    user_id: Uint8Array,
    tower_embedding: number[] | null,
};


export type UserAttributes = {
    username: string;
    email: string;
    uid_hex: string;
    uid_bytes: Uint8Array;
};

export type TablePair = {
    var_name: string;
    table_name: string;
};
