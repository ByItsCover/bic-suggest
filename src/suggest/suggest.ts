import { RequestContext } from "@aws-lambda-powertools/event-handler/types";
import * as lancedb from "@lancedb/lancedb";
import userDetails from "./user_query";
import alreadyRated from "./get_feedback";
import vectorSearch from "./vector_search";
import diversify from "./diversify";
import { CoverResult, UserAttributes } from "../types";
import logger from "../logger";


const suggest = async (reqCtx : RequestContext) => {
    const body: {} = await reqCtx.req.json();
    logger.info('Printing body of request');
    logger.info(JSON.stringify(body));

    let suggestResults: CoverResult[] = [];
    let responseCode = 200;

    const userAttributes = reqCtx.get("user_attributes") as UserAttributes | null;
    const usersTable = reqCtx.get("users_table") as lancedb.Table | null;
    const coversTable = reqCtx.get("covers_table") as lancedb.Table | null;
    const feedbackTable = reqCtx.get("feedback_table") as lancedb.Table | null;

    if (usersTable === null || coversTable === null) {
        logger.info("User and/or cover table have yet to be created. Returning empty results");
        responseCode = 204;
    } else {
        const userObject = await userDetails(userAttributes, usersTable);
        if (userObject.tower_embedding === null) {
            throw new Error("Both default user and current user do not yet have embeddings");
        }

        let rated_covers: string[] = []
        if (userAttributes !== null && feedbackTable !== null) {
            rated_covers = await alreadyRated(userAttributes.uid_hex, feedbackTable);
        }

        suggestResults = await vectorSearch(userObject.tower_embedding, rated_covers, coversTable);
        suggestResults = diversify(suggestResults);
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
