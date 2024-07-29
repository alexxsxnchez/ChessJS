import { generatePseudoLegal } from "../GameManager/bbmovegen.js";

function perftRoot(position, depth) {
    if (depth === 0) {
        return 1;
    }
    let nodes = 0;
    const moves = generatePseudoLegal(position);
    for (let move of moves) {
        if (position.makeMove(move)) {
            nodes += perft(position, depth - 1);
            console.log(`Update... ${nodes}`);
        }
        position.undoMove(move);
    }
    return nodes;
}

function perft(position, depth) {
    if (depth === 0) {
        return 1;
    }
    let nodes = 0;
    const moves = generatePseudoLegal(position);
    for (let move of moves) {
        if (position.makeMove(move)) {
            nodes += perft(position, depth - 1);
        }
        position.undoMove(move);
    }
    return nodes;
}

async function loadTestSuite() {
    console.log("loading suite...");
    const res = await fetch("./Perft/suite/suite2.txt");
    const text = await res.text();

    const perftTests = [];
    text.split(/\r?\n/).map((line) => {
        const components = line.split(";");
        const fen = components[0];
        const components2 = components[1].trim().split(" ");
        perftTests.push({
            fen: fen,
            depth: components2[0],
            expected: components2[1],
        });
    });
    return perftTests;
}

async function runTestSuite() {
    const perftTests = await loadTestSuite();

    let passed = 0;
    let i = 0;
    const worker = new Worker("Engine/worker.js", { type: "module" });

    function sendNextTestToWorker() {
        if (i < perftTests.length) {
            const perftTest = perftTests[i];
            i++;
            console.log(`Running test ${i}`);
            worker.postMessage({
                type: "perft",
                ...perftTest,
            });
        } else {
            console.log();
            console.log(`Done! Results: ${passed}/${perftTests.length}`);
        }
    }

    worker.onmessage = (e) => {
        passed += e.data;
        sendNextTestToWorker();
    };

    sendNextTestToWorker();
}

export { runTestSuite, perftRoot };
