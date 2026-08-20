import { RequestContext } from "@aws-lambda-powertools/event-handler/types";
import * as lancedb from "@lancedb/lancedb";
import { ensureUser, updateFeedback } from "../utils/lancedb";
import { UserAttributes, CoverRating } from "../types";
import logger from "../logger";


const rate = async (reqCtx : RequestContext) => {
    const body: {rating: CoverRating} = await reqCtx.req.json();
    logger.info('Printing body of request');
    logger.info(JSON.stringify(body));

    let ratingMessage = "Did some rating";
    let responseCode = 201;

    const userAttributes = reqCtx.get("user_attributes") as UserAttributes;
    const usersTablePromise = reqCtx.get("users_table_promise") as Promise<lancedb.Table>;
    const feedbackTablePromise = reqCtx.get("feedback_table_promise") as Promise<lancedb.Table>;

    const [feedbackResult, userResult] = await Promise.all([
        updateFeedback(userAttributes, body.rating, usersTablePromise),
        ensureUser(userAttributes, feedbackTablePromise),
    ]);

    if (!feedbackResult) {
        logger.info("Feedback table has yet to be created");
        ratingMessage = "Rating failed";
        responseCode = 424;
    }
    if (!userResult) {
        logger.info("Users table has yet to be created");
        ratingMessage += ". Ensure User failed";
        if (feedbackResult) {
            responseCode = 207;
        }
    }

    return {
        statusCode: responseCode,
        body: JSON.stringify({
            message: ratingMessage,
            attributes: userAttributes,
        })
    }
}

export default rate;
