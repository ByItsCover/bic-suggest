import type { Middleware } from "@aws-lambda-powertools/event-handler/types";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import { CognitoIdTokenPayload } from "aws-jwt-verify/jwt-model";
import { APIGatewayEvent } from "aws-lambda";
import * as lancedb from "@lancedb/lancedb";
import { toHex } from "./utils";
import { UserAttributes, TablePair } from "./types";
import { constants } from "./constants";


const lanceMiddleware: Middleware = async ({ reqCtx, next }) => {
    const db = await lancedb.connect(process.env.DB_URI);
    const tablesMap: TablePair[] = [
        {var_name: "covers_table", table_name: constants.covers_table_name},
        {var_name: "users_table", table_name: constants.users_table_name},
        {var_name: "feedback_table", table_name: constants.feedback_table_name},
    ];

    await Promise.all(tablesMap.map(async (pair) => {
        try {
            const table = await db.openTable(pair.table_name);
            reqCtx.set(pair.var_name, table);
        } catch (error) {
            console.error(`${pair.table_name} Table open failed`, error);
            reqCtx.set(pair.var_name, null);
        }
    }));

    await next();
};

const customAuthMiddleware: Middleware = async ({ reqCtx, next }) => {
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

const awsAuthMiddleware: Middleware = async ({ reqCtx, next }) => {
    const event = reqCtx.event as APIGatewayEvent;
    const claims: CognitoIdTokenPayload = event.requestContext?.authorizer?.jwt.claims;

    const userAttributes: UserAttributes = {
        username: claims["cognito:username"],
        email: claims["email"]!.toLocaleString(),
        uid_hex: toHex(claims["custom:uid"]!.toLocaleString()),
    }

    reqCtx.set("user_attributes", userAttributes);
    await next();
}

export { lanceMiddleware, customAuthMiddleware, awsAuthMiddleware };
