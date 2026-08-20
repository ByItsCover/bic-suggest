import { RequestContext } from "@aws-lambda-powertools/event-handler/types";
import * as lancedb from "@lancedb/lancedb";
import { deleteFeedback } from "../utils/lancedb";
import { UserAttributes } from "../types";
import logger from "../logger";


const deleteRating = async (reqCtx : RequestContext) => {
    const coverId = Number(reqCtx.params["cover_id"]);
    logger.info(`Cover ID for rating removal: ${coverId}`);
    let ratingMessage = "Cover deleted";
    let responseCode = 200;

    const userAttributes = reqCtx.get("user_attributes") as UserAttributes;
    const feedbackTablePromise = reqCtx.get("feedback_table_promise") as Promise<lancedb.Table>;

    const deleteResult = await deleteFeedback(userAttributes.uid_hex, coverId, feedbackTablePromise);
    if (!deleteResult) {
        ratingMessage = "Delete rating failed";
        responseCode = 410;
    }

    return {
        statusCode: responseCode,
        body: JSON.stringify({
            message: ratingMessage,
        })
    }
}

export default deleteRating;
