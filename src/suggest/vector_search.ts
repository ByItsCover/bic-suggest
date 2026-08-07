import * as lancedb from "@lancedb/lancedb";
import { CoverResult } from "../types";
import { constants } from "../constants";
import logger from "../logger";


const vectorSearch = async (embedding: number[], id_filter: string[], coversTable: lancedb.Table) => {
    let query = coversTable.query()
        .nearestTo(embedding)
        .distanceType(constants.distance_type)
        .column("tower_embedding");
    if (id_filter.length > 0) {
        query = query.where(`cover_id NOT IN (${id_filter.join(', ')})`);
    }

    const tableRes: CoverResult[] = await query
        .select(["cover_id", "book_id", "isbn_13", "cover_url", "cover_embedding", "_distance"])
        .limit(constants.relevant_items_limit)
        .toArray();

    //logger.info('Printing vector search results);');
    //console.table(tableRes);

    return tableRes;
}

export default vectorSearch;
