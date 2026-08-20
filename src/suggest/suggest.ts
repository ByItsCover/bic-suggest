import { RequestContext } from "@aws-lambda-powertools/event-handler/types";
import * as lancedb from "@lancedb/lancedb";
import { alreadyRated, userDetails, vectorSearch } from "../utils/lancedb";
import diversify from "../utils/diversify";
import { CoverResult, UserAttributes } from "../types";
import logger from "../logger";


const suggest = async (reqCtx : RequestContext) => {
    const body: {} = await reqCtx.req.json();
    logger.info('Printing body of request');
    logger.info(JSON.stringify(body));

    let suggestResults: CoverResult[] = [];
    let responseCode = 200;

    const userAttributes = reqCtx.get("user_attributes") as UserAttributes | null;
    const usersTablePromise = reqCtx.get("users_table_promise") as Promise<lancedb.Table>;
    const coversTablePromise = reqCtx.get("covers_table_promise") as Promise<lancedb.Table>;
    const feedbackTablePromise = reqCtx.get("feedback_table_promise") as Promise<lancedb.Table>;

    const userEmbedding = await userDetails(userAttributes, usersTablePromise);
    if (userEmbedding === null) {
        logger.info("User and/or cover table have yet to be created. Returning empty results");
        responseCode = 204;
    } else {
        let rated_covers: string[] = []
        if (userAttributes !== null) {
            rated_covers = await alreadyRated(userAttributes.uid_hex, feedbackTablePromise);
        }

        suggestResults = await vectorSearch(userEmbedding, rated_covers, coversTablePromise);
        if (suggestResults.length > 0) {
            suggestResults = diversify(suggestResults);
        }
    }

    return {
        statusCode: responseCode,
        body: JSON.stringify({
            covers: suggestResults.map((res) => ({
                ...res,
                cover_id: Number(res.cover_id),
                book_id: Number(res.book_id),
                cover_embedding: Array.from(res.cover_embedding),
            })),
            attributes: userAttributes,
        }),
    };
}

export default suggest;
