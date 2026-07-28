import { RequestContext } from "@aws-lambda-powertools/event-handler/types";
import * as lancedb from "@lancedb/lancedb";
import addFeedback from "./add_feedback";
import ensureUser from "./ensure_user";
import { UserAttributes, CoverRating } from "../types";
import logger from "../logger";


const rate = async (reqCtx : RequestContext) => {
    const body: {rating: CoverRating} = await reqCtx.req.json();
    logger.info('Printing body of request');
    logger.info(JSON.stringify(body));

    let ratingMessage = "Did some rating";
    let responseCode = 201;

    const userAttributes = reqCtx.get("user_attributes") as UserAttributes;
    const usersTable = reqCtx.get("users_table") as lancedb.Table | null;
    const feedbackTable = reqCtx.get("feedback_table") as lancedb.Table | null;

    if (feedbackTable === null) {
        logger.info("Feedback table has yet to be created");
        ratingMessage = "Rating failed";
        responseCode = 424;
    } else if (usersTable === null) {
        logger.info("Users table has yet to be created");
        ratingMessage = "Rating failed";
        responseCode = 424;
    } else {
        await Promise.all([
            addFeedback(userAttributes, body.rating, feedbackTable),
            ensureUser(userAttributes, usersTable),
        ]);
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
