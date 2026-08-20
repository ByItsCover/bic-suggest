import { RequestContext } from "@aws-lambda-powertools/event-handler/types";
import * as lancedb from "@lancedb/lancedb";
import { alreadyRated, userRatings } from "../utils/lancedb";
import { UserAttributes } from "../types";


const getRatings = async (reqCtx : RequestContext) => {
    let responseCode = 200;

    const userAttributes = reqCtx.get("user_attributes") as UserAttributes;
    const coversTablePromise = reqCtx.get("covers_table_promise") as Promise<lancedb.Table>;
    const feedbackTablePromise = reqCtx.get("feedback_table_promise") as Promise<lancedb.Table>;

    const ratedCovers = await alreadyRated(userAttributes.uid_hex, feedbackTablePromise, true);
    const fetchResults = await userRatings(ratedCovers, coversTablePromise);

    return {
        statusCode: responseCode,
        body: JSON.stringify({
            covers: fetchResults.map((res) => ({
                ...res,
                cover_id: Number(res.cover_id),
                book_id: Number(res.book_id),
                cover_embedding: Array.from(res.cover_embedding),
            })),
            attributes: userAttributes,
        }),
    };
}

export default getRatings;
