import * as lancedb from "@lancedb/lancedb"
import { NIL as NIL_UUID } from "uuid";
import { toHex } from "../utils";
import { UserResult } from "../types";
import logger from "../logger";


const userQuery = async (user_id: string, usersTable: lancedb.Table) => {
    const default_user_id = toHex(NIL_UUID);
    const tableRes: UserResult[] = await usersTable.query()
        .where(`user_id IN (X'${user_id}', X'${default_user_id}')`)
        .select(["user_id", "tower_embedding"])
        .limit(2)
        .toArray();

    logger.info('Printing user query results);');
    console.table(tableRes);

    if (tableRes.length == 1)
        return tableRes[0];

    const user_object = tableRes.find(user => user.user_id === user_id);
    if (user_object === undefined) {
        throw new Error("Both default user and current user do not yet exist");
    }

    return user_object;
}

export default userQuery;
