import { RequestContext } from "@aws-lambda-powertools/event-handler/types";
import logger from "../logger";


const rate = async (reqCtx : RequestContext) => {
    const body: {} = await reqCtx.req.json();
    logger.info('Printing body of request');
    logger.info(JSON.stringify(body));

    return {
        statusCode: 201,
        body: JSON.stringify({
            message: 'Did some rating',
        })
    }
}

export default rate;
