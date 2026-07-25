import * as lancedb from "@lancedb/lancedb";
import { CoverResult } from "../types";
import { constants } from "../constants";
import logger from "../logger";


const vectorSearch = async (embedding: number[], coversTable: lancedb.Table) => {
    const tableRes: CoverResult[] = await coversTable.query()
        .nearestTo(embedding)
        .column("tower_embedding")
        .select(["cover_id", "book_id", "isbn_13", "cover_url", "_distance"])
        .limit(constants.results_limit)
        .toArray();

    logger.info('Printing vector search results);');
    console.table(tableRes);

    return tableRes;
}

export default vectorSearch;
