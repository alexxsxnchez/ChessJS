import Search from "./search.js";
import Position from "../GameLogic/position.js";
import { ZobristHash } from "../GameLogic/zobrist.js";
import { perftRoot } from "../Perft/perft.js";

const search = new Search();

function runPerftTest(fen, depth, expected) {
    console.log(fen);
    console.log(`Expected result: ${expected}`);
    const startTime = new Date();
    const actual = perftRoot(new Position(fen), depth);
    console.log(`Actual result: ${actual}`);
    const result = parseInt(expected) === actual;
    if (result) {
        console.log("PASSED");
    } else {
        console.log("FAILED");
    }
    console.log(new Date() - startTime);
    console.log();
    postMessage(result);
}

onmessage = (e) => {
    const data = e.data;
    if (data.type === "search") {
        const hashHistory = data.hashHistory.map((value) => {
            return { hash: new ZobristHash(value.lo, value.hi) };
        });
        const position = new Position(data.fen, hashHistory);
        const result = search.iterativeDeepeningSearch(position);
        postMessage(result);
        // } else if (data.type === "cancel") {
        //     console.log("cancel message");
        //     search.cancelled = true;
    } else if (data.type === "perft") {
        runPerftTest(data.fen, data.depth, data.expected);
    }
};
