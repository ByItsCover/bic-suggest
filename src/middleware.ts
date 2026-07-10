import type { Middleware } from "@aws-lambda-powertools/event-handler/types";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import * as lancedb from "@lancedb/lancedb";
import { constants } from "./constants";
import {UserAttributes} from "./types";


const lanceMiddleware: Middleware = async ({ reqCtx, next }) => {
    const db = await lancedb.connect(process.env.DB_URI);
    const table = await db.openTable(constants.db_table_name);
    reqCtx.set('lance_table', table);
    await next();
};

const authMiddleware: Middleware = async ({ reqCtx, next }) => {
    const verifier = CognitoJwtVerifier.create({
        userPoolId: process.env.COGNITO_USER_POOL_ID,
        tokenUse: "access",
        clientId: process.env.COGNITO_CLIENT_ID,
    });

    const accessHeader = reqCtx.event.headers?.Authorization ?? reqCtx.event.headers?.authorization ?? null;
    const token = accessHeader !== null ? accessHeader.replace("Bearer ", "") : null;
    let userAttributes: UserAttributes | null = null;

    if (token !== null) {
        try {
            const payload = await verifier.verify(token);
            userAttributes = {
                username: payload.username,
                email: payload["email"]!.toLocaleString(),
                uid: payload["custom:uid"]!.toLocaleString(),
            }
        } catch (error) {
            console.error("Token is not valid", error);
        }
    }

    reqCtx.set("userAttributes", userAttributes);
    await next();
}

export { lanceMiddleware, authMiddleware };
