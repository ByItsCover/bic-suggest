import * as lancedb from "@lancedb/lancedb";
import { UserAttributes, UserUpload } from "../types";
import logger from "../logger";


const ensureUser = async (userAttributes: UserAttributes, usersTable: lancedb.Table) => {
    try {
        const user: UserUpload = {
            user_id: userAttributes.uid_bytes,
        };
        logger.info("Completed user conversion:");
        console.log(user);

        const mergeSertRes = await usersTable.mergeInsert("user_id")
            .whenNotMatchedInsertAll()
            .execute([user]);
        logger.info("Completed table merge-sert");

        logger.info('Printing user merge-sert result:');
        console.table(mergeSertRes);
    } catch (error) {
        console.error("Merge-sert user failed", error);
    }
}

export default ensureUser;
