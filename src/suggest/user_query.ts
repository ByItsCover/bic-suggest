import * as lancedb from "@lancedb/lancedb"
import { NIL as NIL_UUID } from "uuid";
import { toHex, toBytes, idsAreEqual } from "../utils";
import { UserAttributes, UserResult } from "../types";
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

export default userDetails;
