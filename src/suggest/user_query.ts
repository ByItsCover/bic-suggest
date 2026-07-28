import * as lancedb from "@lancedb/lancedb"
import { NIL as NIL_UUID } from "uuid";
import { toHex } from "../utils";
import { UserAttributes, UserResult, CoverResult, FeedbackResult } from "../types";
import { constants } from "../constants";
import logger from "../logger";


const userDetails = async (userAttributes: UserAttributes | null, usersTable: lancedb.Table) => {
    const defaultUserId = toHex(NIL_UUID);
    let idQuery = `user_id = X'${defaultUserId}'`;
    if (userAttributes !== null) {
        idQuery = `user_id IN (X'${userAttributes.uid_hex}', X'${defaultUserId}')`;
    }

    const tableRes: UserResult[] = await usersTable.query()
        .where(idQuery)
        .select(["user_id", "tower_embedding"])
        .limit(2)
        .toArray();

    logger.info('Printing user query results);');
    console.table(tableRes);

    if (tableRes.length == 1)
        return tableRes[0];

    let details = userAttributes === null ? undefined
        : tableRes.find(user => user.user_id === userAttributes.uid_hex);

    if (details === undefined) {
        throw new Error("Both default user and current user do not yet exist");
    }

    if (details.tower_embedding === null) {
        details = tableRes.find(user => user.user_id === defaultUserId);

        if (details === undefined) {
            throw new Error("Default user does not yet exist");
        }
    }

    return details;
}

const userRatings = async (
    results: CoverResult[], userAttributes: UserAttributes, feedbackTable: lancedb.Table
) => {
    const cover_ids = results.map(cover => String(cover.cover_id));
    const uidQuery = `user_id = X'${userAttributes.uid_hex}'`;
    const cidQuery = `cover_id IN (${cover_ids.join(', ')})`;
    const typeQuery = `type = '${constants.rating_type_name}'`;

    const tableRes: FeedbackResult[] = await feedbackTable.query()
        .where(`(${uidQuery}) AND (${typeQuery}) AND (${cidQuery})`)
        .select(["cover_id", "score"])
        .limit(cover_ids.length)
        .toArray();

    const ratings_map = new Map(tableRes.map(feedback => [String(feedback.cover_id), feedback.score]));
    results.forEach((cover, ind, array) => {
        const score = ratings_map.get(String(cover.cover_id));
        if (score !== undefined) {
            array[ind].rating = score;
        }
    })

    return results;
}

export { userDetails, userRatings };
