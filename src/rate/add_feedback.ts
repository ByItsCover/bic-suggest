import * as lancedb from "@lancedb/lancedb";
import { CoverRating, UserAttributes, FeedbackUpload, Feedback, Rating } from "../types";
import logger from "../logger";


const addFeedback = async (userAttributes: UserAttributes, rating: CoverRating, feedbackTable: lancedb.Table) => {
    try {
        const feedback: FeedbackUpload = {
            user_id: userAttributes.uid_hex,
            cover_id: rating.cover_id,
            type: Feedback[Feedback.Rating],
            score: Rating[rating.score as unknown as keyof typeof Rating],
            timestamp: Date.now() * 1000,
        };
        logger.info("Completed feedback conversion:");
        console.log(feedback);
        const addRes = await feedbackTable.add([feedback]);
        logger.info("Completed table add");

        logger.info('Printing feedback add result:');
        console.table(addRes);
    } catch (error) {
        console.error("Add feedback failed", error);
    }
}

export default addFeedback;
