import * as lancedb from "@lancedb/lancedb"
import { NIL as NIL_UUID } from "uuid";
import { toHex, toBytes, idsAreEqual } from "../utils";
import { UserAttributes, UserResult, CoverResult, FeedbackResult, Feedback, Rating } from "../types";
import logger from "../logger";


const userDetails = async (userAttributes: UserAttributes | null, usersTable: lancedb.Table) => {
    const defaultUserId = toHex(NIL_UUID);
    const defaultUserIdBytes = toBytes(NIL_UUID);
    let idQuery = `user_id = X'${defaultUserId}'`;
    if (userAttributes !== null) {
        idQuery = `user_id IN (X'${userAttributes.uid_hex}', X'${defaultUserId}')`;
    }

    const tableRes: UserResult[] = await usersTable.query()
        .where(idQuery)
        .select(["user_id", "tower_embedding"])
        .limit(2)
        .toArray();

    logger.info('Printing user query results:');
    console.table(tableRes);

    if (tableRes.length == 1)
        return tableRes[0];

    let details = userAttributes === null ? undefined
        : tableRes.find(user => idsAreEqual(user.user_id, userAttributes.uid_bytes));

    if (details === undefined) {
        throw new Error("Both default user and current user do not yet exist");
    }

    if (details.tower_embedding === null) {
        const defaultUserDetails = tableRes.find(user => idsAreEqual(user.user_id, defaultUserIdBytes));
        if (defaultUserDetails === undefined) {
            throw new Error("Default user does not yet exist");
        }

        logger.info("User embedding is null, defaulting to default user embedding");
        details.tower_embedding = defaultUserDetails.tower_embedding;
    }

    return details;
}

const userRatings = async (
    results: CoverResult[], userAttributes: UserAttributes, feedbackTable: lancedb.Table
) => {
    const cover_ids = results.map(cover => String(cover.cover_id));
    const uidQuery = `user_id = X'${userAttributes.uid_hex}'`;
    const cidQuery = `cover_id IN (${cover_ids.join(', ')})`;
    const typeQuery = `type = '${Feedback[Feedback.Rating]}'`;

    logger.info('Trying feedback table query');
    const tableRes: FeedbackResult[] = await feedbackTable.query()
        .where(`(${uidQuery}) AND (${typeQuery}) AND (${cidQuery})`)
        .select(["cover_id", "score"])
        .limit(cover_ids.length)
        .toArray();

    logger.info('Printing user ratings results:');
    console.table(tableRes);

    const ratings_map = new Map(tableRes.map(feedback => [String(feedback.cover_id), feedback.score]));
    const updated_results: CoverResult[] = results.map((cover, ind) => {
        const score = ratings_map.get(String(cover.cover_id));
        return score !== undefined ? {
            ...results[ind],
            rating: score
        } : results[ind];
    })

    logger.info('Mapping results done:');
    console.log(updated_results);

    return updated_results;
}

export { userDetails, userRatings };
