import type { Middleware } from "@aws-lambda-powertools/event-handler/types";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import * as lancedb from "@lancedb/lancedb";
import { toHex } from "./utils";
import { UserAttributes } from "./types";
import { constants } from "./constants";


const lanceMiddleware: Middleware = async ({ reqCtx, next }) => {
    const db = await lancedb.connect(process.env.DB_URI);
    const covers_table = await db.openTable(constants.covers_table_name);
    const users_table = await db.openTable(constants.users_table_name);
    const feedback_table = await db.openTable(constants.feedback_table_name);

    reqCtx.set('covers_table', covers_table);
    reqCtx.set('users_table', users_table);
    reqCtx.set('feedback_table', feedback_table);
    await next();
};

const authMiddleware: Middleware = async ({ reqCtx, next }) => {
    const verifier = CognitoJwtVerifier.create({
        userPoolId: process.env.COGNITO_USER_POOL_ID,
        tokenUse: "id",
        clientId: process.env.COGNITO_CLIENT_ID,
    });

    const accessHeader = reqCtx.event.headers?.Authorization ?? reqCtx.event.headers?.authorization ?? null;
    const token = accessHeader !== null ? accessHeader.replace("Bearer ", "") : null;
    let userAttributes: UserAttributes | null = null;

    if (token !== null) {
        try {
            const payload = await verifier.verify(token);
            console.log(payload);
            userAttributes = {
                username: payload["cognito:username"],
                email: payload["email"]!.toLocaleString(),
                uid_hex: toHex(payload["custom:uid"]!.toLocaleString()),
            }
        } catch (error) {
            console.error("Token is not valid", error);
        }
    }

    reqCtx.set("user_attributes", userAttributes);
    await next();
}

export { lanceMiddleware, authMiddleware };
