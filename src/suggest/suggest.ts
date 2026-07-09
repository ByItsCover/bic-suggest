import { RequestContext } from "@aws-lambda-powertools/event-handler/types";
import logger from "../logger";
import { CoverResult, UserAttributes } from "../types";

const suggest = async (reqCtx : RequestContext) => {
    const body: {} = await reqCtx.req.json();
    logger.info('Printing body of request');
    logger.info(JSON.stringify(body));

    const userAttributes = reqCtx.get("userAttributes") as UserAttributes;

    const suggestResults: CoverResult[] = [{
        cover_id: 123n,
        book_id: 456n,
        isbn_13: "1234567891011",
        cover_url: "https://www.pokemon.com/static-assets/content-assets/cms2/img/pokedex/full/612.png",
        _distance: null,
    }]

    return {
        statusCode: 200,
        body: JSON.stringify({
            covers: suggestResults.map((res) => ({
                cover_id: Number(res.cover_id),
                book_id: Number(res.book_id),
            })),
            attributes: userAttributes,
        }),
    };
}

export default suggest;
