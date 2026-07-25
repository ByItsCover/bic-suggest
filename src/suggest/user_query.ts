import * as lancedb from "@lancedb/lancedb"
import { NIL as NIL_UUID } from "uuid";
import { toHex } from "../utils";
import { UserAttributes, UserResult } from "../types";
import logger from "../logger";


const userQuery = async (userAttributes: UserAttributes | null, usersTable: lancedb.Table) => {
    const default_user_id = toHex(NIL_UUID);
    let id_query = `user_id = X'${default_user_id}')`;
    if (userAttributes !== null) {
        id_query = `user_id IN (X'${userAttributes.uid_hex}', X'${default_user_id}')`
    }

    const tableRes: UserResult[] = await usersTable.query()
        .where(id_query)
        .select(["user_id", "tower_embedding"])
        .limit(2)
        .toArray();

    logger.info('Printing user query results);');
    console.table(tableRes);

    if (tableRes.length == 1)
        return tableRes[0];

    const user_object = userAttributes === null ? undefined
        : tableRes.find(user => user.user_id === userAttributes.uid_hex);
    if (user_object === undefined) {
        throw new Error("Both default user and current user do not yet exist");
    }

    return user_object;
}

export default userQuery;
