import {
    TranspositionTable,
    PVEntry,
    TTFlag,
    TranspositionEntry,
} from "./transposition.js";
import Timer from "./timer.js";
import evaluate from "./evaluation.js";
import { PieceType } from "../GameLogic/piece.js";
import * as moveGen from "../GameLogic/movegen.js";
import { MoveType } from "../GameLogic/move.js";

class Search {
    constructor() {
        this.transpositionTable = new TranspositionTable();
        this.pvTable = new TranspositionTable(); //1e4);
        this.timer = new Timer();
        this.realPly = 0;
        this.totalNodes = 0;
    }

    iterativeDeepeningSearch(position, timeLimit = 5000) {
        this.totalNodes = 0;
        let currentDepth = 1;
        let lastGoodPVLine = []; // keeping separate from pvLine, bc might return out of negamax early bc of timer. so pvLine would be incomplete

        this.timer.start(timeLimit);
        while (currentDepth <= 100) {
            const pvLine = [];
            console.log(
                `About to search at depth ${currentDepth}. ${this.timer.elapsed()}ms elapsed. ${
                    this.totalNodes
                } nodes searched.`
            );

            // TODO: can use score to create aspiration window for next iteration
            const score = this.#negamax(
                position,
                currentDepth,
                0,
                -Infinity,
                Infinity,
                pvLine
            );

            if (this.timer.stop) {
                console.log(
                    `Time limit reached searching at depth ${currentDepth}. ${this.timer.elapsed()}ms elapsed.`
                );
                break;
            }

            console.log(
                `PV Line for depth ${currentDepth}: ${JSON.stringify(pvLine)}`
            );
            lastGoodPVLine = pvLine;

            currentDepth++;
        }

        this.realPly++;

        console.log(`PV Line: ${JSON.stringify(lastGoodPVLine)}`);
        const bestMove = lastGoodPVLine.length > 0 ? lastGoodPVLine[0] : null;
        console.log(`Best move: ${JSON.stringify(bestMove)}`);
        console.log(bestMove);
        return bestMove;
    }

    #negamax(position, depth, ply, alpha, beta, pvLine) {
        this.totalNodes++;

        if (this.totalNodes % 2048 === 0 && this.timer.check()) {
            return 0;
        }

        if (position.isNonStalemateDraw()) {
            return 0;
        }

        const pvEntry = this.pvTable.get(position.hash.lo, position.hash.hi);
        if (pvEntry) {
            pvLine.splice(0, pvLine.length, ...pvEntry.moves);
        }

        if (depth === 0) {
            this.totalNodes--;
            return this.#qSearch(position, alpha, beta, pvLine);
        }

        const ttEntry = this.transpositionTable.get(
            position.hash.lo,
            position.hash.hi
        );

        // could check for legality in rare case a whole different pos was stored here
        if (ttEntry && ttEntry.depth >= depth) {
            if (ttEntry.flag === TTFlag.EXACT) {
                return ttEntry.value;
            } else if (ttEntry.flag === TTFlag.ALPHA && ttEntry.value < alpha) {
                return alpha;
            } else if (ttEntry.flag === TTFlag.BETA && ttEntry.value > beta) {
                return beta;
            }
        }

        let bestScore = -Infinity;
        let bestMove = null;
        let ttFlag = TTFlag.ALPHA; // assume this node is
        const moves = moveGen.generatePseudoLegal(position);

        const moveScores = this.#scoreMoves(
            position,
            moves,
            pvLine.at(0),
            ttEntry?.move
        );

        let legalMoves = 0;

        for (let i = 0; i < moves.length; i++) {
            this.#orderMoves(i, moves, moveScores);
            const move = moves[i];
            const childPVLine = [];

            if (!position.makeMove(move)) {
                position.undoMove(move);
                continue;
            }

            legalMoves++;

            const score = -this.#negamax(
                position,
                depth - 1,
                ply + 1,
                -beta,
                -alpha,
                childPVLine
            );
            position.undoMove(move);

            if (this.timer.stop) {
                return 0;
            }

            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }

            if (score >= beta) {
                // beta-cutoff
                ttFlag = TTFlag.BETA;
                break;
            }
            if (score > alpha) {
                // update pvLine in-place to [move, ...childPVLine]
                pvLine.splice(0, pvLine.length, move, ...childPVLine);
                alpha = score;
                ttFlag = TTFlag.EXACT;
            }
        }

        if (legalMoves === 0) {
            if (position.isKingInCheck()) {
                // checkmate
                return -10000 + ply;
            } else {
                // stalemate
                return 0;
            }
        }

        if (ttFlag === TTFlag.EXACT) {
            const pvLineCopy = [];
            pvLine.forEach((move) => {
                pvLineCopy.push(move);
            });
            this.pvTable.store(
                new PVEntry(position.hash.lo, position.hash.hi, pvLineCopy)
            );
        }

        this.transpositionTable.store(
            new TranspositionEntry(
                position.hash.lo,
                position.hash.hi,
                bestScore,
                bestMove,
                depth,
                ttFlag
            )
        );

        return bestScore;
    }

    // TODO: qSearch doesn't know what checkmate/stalemate is!!
    // forcing checks that lead to checkmate beyond a bit of depth, the engine currently can't see, even though qSearch should find that!
    #qSearch(position, alpha, beta, pvLine) {
        this.totalNodes++;

        if (this.totalNodes % 2048 === 0 && this.timer.check()) {
            return 0;
        }

        let bestScore = evaluate(position);

        const inCheck = position.isKingInCheck();
        if (!inCheck && bestScore >= beta) {
            // beta cutoff
            return bestScore;
        }

        alpha = Math.max(alpha, bestScore);

        let moves = [];
        if (inCheck) {
            moves = moveGen.generatePseudoLegal(position);
        } else {
            moves = moveGen.generateCapturesAndPromotions(position);
        }

        const moveScores = this.#scoreMoves(position, moves, pvLine.at(0));
        for (let i = 0; i < moves.length; i++) {
            this.#orderMoves(i, moves, moveScores);

            const move = moves[i];

            const childPVLine = [];

            if (!position.makeMove(move)) {
                // not a valid move
                position.undoMove(move);
                continue;
            }
            const score = -this.#qSearch(position, -beta, -alpha, childPVLine);
            position.undoMove(move);

            if (this.timer.stop) {
                return 0;
            }

            bestScore = Math.max(bestScore, score);

            if (score >= beta) {
                // beta-cutoff
                break;
            }
            if (score > alpha) {
                // update pvLine in-place to [move, ...childPVLine]
                pvLine.splice(0, pvLine.length, move, ...childPVLine);
                alpha = score;
            }
        }
        return bestScore;
    }

    #getMvvLvaIndex(pieceType) {
        switch (pieceType) {
            case PieceType.PAWN:
                return 0;
            case PieceType.KNIGHT:
                return 1;
            case PieceType.BISHOP:
                return 2;
            case PieceType.ROOK:
                return 3;
            case PieceType.QUEEN:
                return 4;
            case PieceType.KING:
                return 5;
        }
    }

    #orderMoves(currIndex, moves, moveScores) {
        let bestIndex = currIndex;
        let bestScore = moveScores[currIndex];
        for (let i = currIndex + 1; i < moves.length; i++) {
            if (moveScores[i] > bestScore) {
                bestIndex = i;
                bestScore = moveScores[i];
            }
        }
        // swap in moves
        const tempMove = moves[currIndex];
        moves[currIndex] = moves[bestIndex];
        moves[bestIndex] = tempMove;
        // swap in moveScores
        const tempScore = moveScores[currIndex];
        moveScores[currIndex] = moveScores[bestIndex];
        moveScores[bestIndex] = tempScore;
    }

    #scoreMoves(position, moves, pvMove, ttMove = null) {
        const scores = [];
        for (let move of moves) {
            if (pvMove && move.equals(pvMove)) {
                scores.push(33); // highest capture should be 31
            } else if (ttMove && move.equals(ttMove)) {
                scores.push(32);
            } else if (move.moveType === MoveType.CAPTURE_EP) {
                scores.push(6); //pawn-pawn
            } else if (
                move.moveType === MoveType.CAPTURE ||
                move.moveType === MoveType.PROMOTION_CAPTURE
            ) {
                const victim = position.getPiece(move.toSquare).type;
                const attacker = position.getPiece(move.fromSquare).type;
                const victimIndex = this.#getMvvLvaIndex(victim);
                const attackerIndex = this.#getMvvLvaIndex(attacker);
                // pawn-king === 1 // worst capture still puts above non-capture
                // pawn-pawn === 6
                // knight-king === 7
                // knight-pawn === 12
                // bishop-king === 13
                // bishop-pawn === 18
                // rook-king === 19
                // rook-pawn === 24
                // queen-king === 25
                // queen-pawn === 31
                const mvvLvaScore = victimIndex * 6 + (5 - attackerIndex) + 1;
                scores.push(mvvLvaScore);
            } else {
                scores.push(0);
            }
        }
        return scores;
    }
}

export default Search;
