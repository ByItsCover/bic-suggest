import { RequestContext } from "@aws-lambda-powertools/event-handler/types";
import * as lancedb from "@lancedb/lancedb";
import { userDetails, userRatings } from "./user_query";
import vectorSearch from "./vector_search";
import logger from "../logger";
import { UserAttributes } from "../types";


const suggest = async (reqCtx : RequestContext) => {
    const body: {} = await reqCtx.req.json();
    logger.info('Printing body of request');
    logger.info(JSON.stringify(body));

    const userAttributes = reqCtx.get("user_attributes") as UserAttributes | null;
    const usersTable = reqCtx.get("users_table") as lancedb.Table;
    const coversTable = reqCtx.get("covers_table") as lancedb.Table;
    const feedbackTable = reqCtx.get("feedback_table") as lancedb.Table;

    const userObject = await userDetails(userAttributes, usersTable);
    const suggestResults = await vectorSearch(userObject.tower_embedding, coversTable);

    if (userAttributes !== null) {
        await userRatings(suggestResults, userAttributes, feedbackTable);
    }

    return {
        statusCode: 200,
        body: JSON.stringify({
            covers: suggestResults.map((res) => ({
                ...res,
                cover_id: Number(res.cover_id),
                book_id: Number(res.book_id),
            })),
            attributes: userAttributes,
        }),
    };
}

export default suggest;
