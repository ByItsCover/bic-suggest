import * as lancedb from "@lancedb/lancedb";
import { CoverRating, UserAttributes, FeedbackUpload, Feedback } from "../types";
import logger from "../logger";


const addFeedback = async (userAttributes: UserAttributes, rating: CoverRating, feedbackTable: lancedb.Table) => {
    const feedback: FeedbackUpload = {
        user_id: userAttributes.uid_hex,
        cover_id: BigInt(rating.cover_id),
        type: Feedback.Rating,
        score: rating.score,
        timestamp: BigInt(Date.now() * 1000)
    }
    const addRes = await feedbackTable.add([feedback]);

    logger.info('Printing feedback add result);');
    console.table(addRes);
}

export default addFeedback;
