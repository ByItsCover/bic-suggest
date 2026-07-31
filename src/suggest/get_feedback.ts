import * as lancedb from "@lancedb/lancedb"
import { FeedbackResult, Feedback } from "../types";
import logger from "../logger";


const alreadyRated = async (
    user_id_hex: string, feedbackTable: lancedb.Table
) => {
    const uidQuery = `user_id = X'${user_id_hex}'`;
    const typeQuery = `type = '${Feedback[Feedback.Rating]}'`;

    logger.info('Trying feedback table query');
    const tableRes: FeedbackResult[] = await feedbackTable.query()
        .where(`(${uidQuery}) AND (${typeQuery})`)
        .select(["cover_id", "score"])
        .toArray();

    logger.info('Printing user ratings results:');
    console.table(tableRes);

    return tableRes.map(feedback => String(feedback.cover_id));
}

export default alreadyRated;
