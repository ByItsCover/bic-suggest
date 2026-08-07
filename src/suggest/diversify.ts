import * as np from 'numpy-ts';
import { NDArray } from "numpy-ts";
import { CoverResult } from "../types";
import { constants } from "../constants";


const greedy_map_dpp = (L: NDArray<"float32">, k: number) => {
    const numItems = L.shape[0];
    const selected: number[] = [];
    const remaining = new Set([...Array(numItems).keys()]);

    while (k > 0) {
        const candidateSet = np.array([...remaining].map(ind => [...selected, ind]), "int32");
        const detArr = np.linalg.det(np.vindex(
                L, np.expand_dims(candidateSet, -1), np.expand_dims(candidateSet, 1
            ))) as NDArray<"float32">;
        console.log("Argmax:", np.argmax(detArr));
        console.log("Argmax num:", Number(np.argmax(detArr)));
        const bestItem = (candidateSet[np.argmax(detArr) as number] as NDArray<"int32">)[-1] as number;
        console.log("Best item:", bestItem);

        selected.push(bestItem);
        remaining.delete(bestItem);
        k -= 1;
    }

    return selected;
}

const dppKernel = (
    relevance: NDArray<"float32">, embeddings: NDArray<"float32">,
    alpha: number = 0.75, sigma: number = 1
) => {
    const norm = np.sum(np.square(embeddings), -1) as NDArray<"float32">;
    const D = np.expand_dims(norm, -1)
        .add(np.expand_dims(norm, 0))
        .subtract(np.multiply(np.matmul(embeddings, embeddings.T), 2));
    const similarity = np.exp(np.divide(np.negative(D), (2 * sigma**2)));
    const relevantArr = np.multiply(np.expand_dims(relevance, -1), np.expand_dims(relevance, 0));
    const L = np.multiply(np.multiply(relevantArr, alpha), similarity) as NDArray<"float32">;

    const [di, dj] = np.diag_indices_from(L);
    const diagInd = np.ravel_multi_index([di, dj], [...L.shape]).tolist() as number[];
    np.put(L, diagInd, np.vindex(relevantArr, di, dj))
    L.put(diagInd, np.vindex(relevantArr, di, dj));

    return L;
}

const dppRanking = (
    relevance: NDArray<"float32">, embeddings: NDArray<"float32">,
    candidateInds: number[], output_size: number, k: number,
    alpha: number = 0.75, sigma: number = 1
) => {
    let candidates = [...candidateInds];
    const ranking: number[] = [];

    let remaining = output_size;
    while (candidates.length > 0 && remaining > 0) {
        console.timeLog("diversify", `Dpp ranking with ${remaining} outputs left begin`);
        const rel_cands = relevance.iindex(candidates);
        const embed_cands = embeddings.iindex(candidates);
        const L = dppKernel(rel_cands, embed_cands, alpha, sigma);
        console.timeLog("diversify", `Dpp kernel complete`);
        console.log("Ell:", L);

        const windowSize = Math.min(k, remaining);
        const M = greedy_map_dpp(L, k=windowSize);
        console.timeLog("diversify", `Dpp greedy complete`);

        console.log("M:", M);
        const selectedItems =  M.map(m => candidates[m]);
        console.log("Selected items:", selectedItems);
        ranking.push(...selectedItems);

        candidates = candidates.filter(candidate => !selectedItems.includes(candidate));
        remaining -= windowSize;
    }

    return ranking;
};

const diversify = (results: CoverResult[]) => {
    console.time('diversify');
    console.log("Starting DPP");
    const {
        score_acc: scores,
        embed_acc: embeddings,
        ind_acc: indices
    } = results.reduce<{score_acc: number[], embed_acc: number[][], ind_acc: number[]}>((acc, item, ind) => {
        acc.score_acc.push(1 - item._distance);
        acc.embed_acc.push(Array.from(item.cover_embedding));
        acc.ind_acc.push(ind);

        return acc;
    }, {score_acc: [], embed_acc: [], ind_acc: []});

    const scores_arr = np.array(scores, "float32");
    const embeddings_arr = np.array(embeddings, "float32");

    console.timeLog("diversify", "Mapped scores and embeddings");

    const ranking = dppRanking(
        scores_arr, embeddings_arr, indices, constants.results_limit,
        constants.diverse_k, constants.diverse_alpha, constants.diverse_sigma
    );
    console.timeEnd("diversify");
    console.log("Done with DPP");
    console.log("New ranking:", ranking);
    return ranking.map(ind => results[ind]);
};

export default diversify;
