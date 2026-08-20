import { Router } from '@aws-lambda-powertools/event-handler/http';
import { Context, APIGatewayProxyResult, APIGatewayEvent } from 'aws-lambda';
import { lanceMiddleware, customAuthMiddleware, awsAuthMiddleware } from "./middleware";
import health from "./healthcheck/healthcheck";
import suggest from "./suggest/suggest";
import rate from "./rate/rate";
import deleteRating from "./rate/delete";
import logger from "./logger";


const app = new Router();

app.get('/suggest/health', health);
app.post('/suggest/rate', [lanceMiddleware, awsAuthMiddleware], rate);
app.delete('/suggest/rate/:cover_id', [lanceMiddleware, awsAuthMiddleware], deleteRating);
app.post('/suggest', [lanceMiddleware, customAuthMiddleware], suggest);

export const handler = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
    logger.info(`Event: ${JSON.stringify(event, null, 2)}`);
    logger.info(`Context: ${JSON.stringify(context, null, 2)}`);
    return app.resolve(event, context);
};
