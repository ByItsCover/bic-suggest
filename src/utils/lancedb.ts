import { Connection } from "@lancedb/lancedb";
import * as lancedb from "@lancedb/lancedb";
import { NIL as NIL_UUID } from "uuid";
import { idsAreEqual, toBytes, toHex } from "./auth";
import {
    CoverRating,
    CoverResult,
    Feedback, FeedbackResult,
    FeedbackUpload,
    Rating,
    UserAttributes,
    UserResult,
    UserUpload
} from "../types";
import { constants } from "../constants";
import logger from "../logger";


const loadTable = async (table_name: string, dbPromise: Promise<Connection>) => {
    const db = await dbPromise;
    return await db.openTable(table_name);
}

const alreadyRated = async (
    userIdHex: string, feedbackTablePromise: Promise<lancedb.Table>
) => {
    const uidQuery = `user_id = X'${userIdHex}'`;
    const typeQuery = `type = '${Feedback[Feedback.Rating]}'`;

    let feedbackTable: lancedb.Table;
    try {
        feedbackTable = await feedbackTablePromise;
    } catch (error) {
        logger.error("feedback Table open failed", error as Error);
        return [];
    }

    logger.info('Trying feedback table query');
    const tableRes: FeedbackResult[] = await feedbackTable.query()
        .where(`(${uidQuery}) AND (${typeQuery})`)
        .select(["cover_id", "score"])
        .toArray();

    logger.info('Printing user ratings results:');
    console.table(tableRes);

    return tableRes.map(feedback => String(feedback.cover_id));
}

const vectorSearch = async (
    embedding: number[], id_filter: string[], coversTablePromise: Promise<lancedb.Table>
) => {
    let coversTable: lancedb.Table;
    try {
        coversTable = await coversTablePromise;
    } catch (error) {
        logger.error("covers Table open failed", error as Error);
        return [];
    }

    let query = coversTable.query()
        .nearestTo(embedding)
        .distanceType(constants.distance_type)
        .column("tower_embedding");
    if (id_filter.length > 0) {
        query = query.where(`cover_id NOT IN (${id_filter.join(', ')})`);
    }

    const tableRes: CoverResult[] = await query
        .select(["cover_id", "book_id", "isbn_13", "cover_url", "cover_embedding", "_distance"])
        .limit(constants.relevant_items_limit)
        .toArray();

    return tableRes;
}

const userDetails = async (
    userAttributes: UserAttributes | null, usersTablePromise: Promise<lancedb.Table>
) => {
    const defaultUserId = toHex(NIL_UUID);
    const defaultUserIdBytes = toBytes(NIL_UUID);
    let idQuery = `user_id = X'${defaultUserId}'`;
    if (userAttributes !== null) {
        idQuery = `user_id IN (X'${userAttributes.uid_hex}', X'${defaultUserId}')`;
    }

    let usersTable: lancedb.Table;
    try {
        usersTable = await usersTablePromise;
    } catch (error) {
        logger.error("users Table open failed", error as Error);
        return null;
    }

    const tableRes: UserResult[] = await usersTable.query()
        .where(idQuery)
        .select(["user_id", "tower_embedding"])
        .limit(2)
        .toArray();

    logger.info('Printing user query results:');
    console.table(tableRes);

    if (tableRes.length == 1)
        return tableRes[0].tower_embedding;

    let details = userAttributes === null ? undefined
        : tableRes.find(user => idsAreEqual(user.user_id, userAttributes.uid_bytes));

    if (details === undefined) {
        logger.warn("Both default user and current user do not yet exist");
        return null;
    }

    if (details.tower_embedding === null) {
        const defaultUserDetails = tableRes.find(user => idsAreEqual(user.user_id, defaultUserIdBytes));
        if (defaultUserDetails === undefined) {
            logger.warn("Default user does not yet exist");
            return null;
        }

        logger.info("User embedding is null, defaulting to default user embedding");
        return defaultUserDetails.tower_embedding;
    }

    return details.tower_embedding;
}

const updateFeedback = async (
    userAttributes: UserAttributes, rating: CoverRating, feedbackTablePromise: Promise<lancedb.Table>
) => {
    let feedbackTable: lancedb.Table;
    try {
        feedbackTable = await feedbackTablePromise;
    } catch (error) {
        logger.error("feedback Table open failed", error as Error);
        return false;
    }

    const feedback: FeedbackUpload = {
        user_id: userAttributes.uid_bytes,
        cover_id: rating.cover_id,
        type: Feedback[Feedback.Rating],
        score: Rating[rating.score as unknown as keyof typeof Rating],
        timestamp: Date.now(),
    };
    logger.info("Completed feedback conversion:");
    console.log(feedback);

    const mergeSertRes = await feedbackTable.mergeInsert(["user_id", "cover_id", "type"])
        .whenMatchedUpdateAll()
        .whenNotMatchedInsertAll()
        .execute([feedback]);
    logger.info("Completed table insert");

    logger.info('Printing feedback insert result:');
    console.table(mergeSertRes);
    return true;
}

const deleteFeedback = async (
    userIdHex: string, coverId: number, feedbackTablePromise: Promise<lancedb.Table>
) => {
    const uidQuery = `user_id = X'${userIdHex}'`;
    const cidQuery = `cover_id = ${coverId}`;
    const typeQuery = `type = '${Feedback[Feedback.Rating]}'`;

    let feedbackTable: lancedb.Table;
    try {
        feedbackTable = await feedbackTablePromise;
    } catch (error) {
        logger.error("feedback Table open failed", error as Error);
        return false;
    }

    logger.info('Trying feedback table cover delete');
    const deleteRes = await feedbackTable
        .delete(`(${uidQuery}) AND (${typeQuery}) AND (${cidQuery})`);

    logger.info(`Covers deleted: ${deleteRes.numDeletedRows}`);
    return true;
}

const ensureUser = async (
    userAttributes: UserAttributes, usersTablePromise: Promise<lancedb.Table>
) => {
    const user: UserUpload = {
        user_id: userAttributes.uid_bytes,
    };

    let usersTable: lancedb.Table;
    try {
        usersTable = await usersTablePromise;
    } catch (error) {
        logger.error("users Table open failed", error as Error);
        return false;
    }

    const mergeSertRes = await usersTable.mergeInsert("user_id")
        .whenNotMatchedInsertAll()
        .execute([user]);
    logger.info("Completed table merge-sert");

    logger.info('Printing user merge-sert result:');
    console.table(mergeSertRes);
    return true;
}

export { loadTable, alreadyRated, vectorSearch, userDetails, updateFeedback, deleteFeedback, ensureUser };
