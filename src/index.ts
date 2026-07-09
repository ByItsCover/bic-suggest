import { Router } from '@aws-lambda-powertools/event-handler/http';
import { Context, APIGatewayProxyResult, APIGatewayEvent } from 'aws-lambda';
import logger from "./logger";
import { lanceMiddleware, authMiddleware } from "./middleware";
import health from "./healthcheck/healthcheck";
import suggest from "./suggest/suggest";
import rate from "./suggest/rate";


const app = new Router();

app.get('/suggest/health', health);
app.post('/suggest/rate', [lanceMiddleware], rate);
app.post('/suggest', [lanceMiddleware, authMiddleware], suggest);

export const handler = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
    logger.info(`Event: ${JSON.stringify(event, null, 2)}`);
    logger.info(`Context: ${JSON.stringify(context, null, 2)}`);
    return app.resolve(event, context);
};
