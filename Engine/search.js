import Position from "../GameManager/position.js";
import ZobristTable from "./zobrist.js";
import {
    TranspositionTable,
    PVEntry,
    TTFlag,
    TranspositionEntry,
} from "./transposition.js";
import evaluate from "./evaluation.js";
import { EnPassantMove, PromotionMove } from "../GameManager/Immutable/move.js";
import { PieceType } from "../GameManager/Immutable/Pieces/utils.js";

class Search {
    constructor() {
        this.zobristTable = new ZobristTable();
        this.transpositionTable = new TranspositionTable();
        this.pvTable = new TranspositionTable(); //1e4);
        this.realPly = 0;
    }

    iterativeDeepeningSearch(position, timeLimit = 5000) {
        const startTime = new Date();
        let currentDepth = 1;
        let lastGoodPVLine = []; // keeping separate from pvLine, bc might return out of negamax early bc of timer. so pvLine would be incomplete
        // 100
        while (currentDepth <= 100) {
            const pvLine = [];
            const elapsedTime = new Date() - startTime;
            if (elapsedTime >= timeLimit) {
                console.log(
                    `Time limit reached before searching at depth ${currentDepth}. ${elapsedTime}ms elapsed.`
                );
                break;
            }
            console.log(
                `About to search at depth ${currentDepth}. ${elapsedTime}ms elapsed.`
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

    #negamax(currentPosition, depth, ply, alpha, beta, pvLine) {
        const [loHash, hiHash] = this.zobristTable.computeHash(currentPosition);
        const ttEntry = this.transpositionTable.get(loHash, hiHash);

        // could check for legality in rare case a whole different pos was stored here
        if (/*ply > 0 && */ ttEntry && ttEntry.depth >= depth) {
            if (ttEntry.flag === TTFlag.EXACT) {
                const pvEntry = this.pvTable.get(loHash, hiHash);
                if (pvEntry) {
                    pvLine.splice(0, pvLine.length, ...pvEntry.moves);
                } else {
                    console.log("WTFF!!!");
                }
                // if (ply > 0) {
                return ttEntry.value;
                // }
            } else if (ttEntry.flag === TTFlag.ALPHA && ttEntry.value < alpha) {
                return alpha;

                //alpha = Math.max(alpha, ttEntry.value);
            } else if (ttEntry.flag === TTFlag.BETA && ttEntry.value > beta) {
                return beta;
                //beta = Math.min(beta, ttEntry.value);
            }
            // if (alpha >= beta) {
            //     console.log("cutoff");
            //     return beta; //ttEntry.value; // should this be return beta??
            // }
        }

        // if (!currentPosition.doLegalMovesExist()) {
        //     if (currentPosition.isKingInCheck()) {
        //         // checkmate
        //         return -100000 + ply;
        //     } else {
        //         // stalemate
        //         return 0;
        //     }
        // }

        if (depth === 0 || !currentPosition.doLegalMovesExist()) {
            return this.#qSearch(currentPosition, ply, alpha, beta, pvLine);
        }

        let bestScore = -Infinity;
        let bestMove = null;
        let ttFlag = TTFlag.ALPHA; // assume this node is
        const legalMoves = currentPosition.getLegalMoves();

        const moveScores = this.#scoreMoves(
            currentPosition,
            legalMoves,
            pvLine.at(0),
            ttEntry?.move
        );

        for (let i = 0; i < legalMoves.length; i++) {
            this.#orderMoves(i, legalMoves, moveScores);
            const move = legalMoves[i];
            const childPVLine = [];
            const newPosition = new Position(currentPosition, move);
            const score = -this.#negamax(
                newPosition,
                depth - 1,
                ply + 1,
                -beta,
                -alpha,
                childPVLine
            );

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

        if (ttFlag === TTFlag.EXACT) {
            const pvLineCopy = [];
            pvLine.forEach((move) => {
                pvLineCopy.push(move);
            });
            this.pvTable.store(
                new PVEntry(loHash, hiHash, pvLineCopy, this.realPly)
            );
        }

        this.transpositionTable.store(
            new TranspositionEntry(
                loHash,
                hiHash,
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
    #qSearch(currentPosition, ply, alpha, beta, pvLine) {
        // NOTE: evaluate must return score relative to who is moving (positive if good for who is moving, etc.)
        let bestScore = evaluate(currentPosition, ply);

        const inCheck = currentPosition.isKingInCheck();
        if (!inCheck && bestScore >= beta) {
            // beta cutoff
            return bestScore;
        }

        alpha = Math.max(alpha, bestScore);

        let moves = [];
        if (inCheck) {
            moves = currentPosition.getLegalMoves();
        } else {
            // get only attacking and promotion moves
            // TODO: do this more efficiently
            const legalMoves = currentPosition.getLegalMoves();
            legalMoves.forEach((legalMove) => {
                if (
                    legalMove instanceof PromotionMove ||
                    legalMove instanceof EnPassantMove ||
                    currentPosition.getPiece(legalMove.toSquare)
                ) {
                    moves.push(legalMove);
                }
            });
        }

        const moveScores = this.#scoreMoves(
            currentPosition,
            moves,
            pvLine.at(0)
        );
        for (let i = 0; i < moves.length; i++) {
            this.#orderMoves(i, moves, moveScores);

            const move = moves[i];

            const childPVLine = [];
            const newPosition = new Position(currentPosition, move);
            const score = -this.#qSearch(
                newPosition,
                ply + 1,
                -beta,
                -alpha,
                childPVLine
            );

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
            } else if (move instanceof EnPassantMove) {
                scores.push(6); //pawn-pawn
            } else if (position.getPiece(move.toSquare)) {
                // capture move
                const victim = position.getPiece(move.toSquare).type;
                const attacker = move.piece.type;
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

    // #alphaBeta(currentPosition, depth, alpha, beta, isMaximizingPlayer) {
    //     if (depth === 0 || !currentPosition.doLegalMovesExist()) {
    //         return { value: evaluate(currentPosition), move: null };
    //     }

    //     let bestValue;
    //     let bestMove = null;
    //     const legalMoves = currentPosition.getLegalMoves();
    //     if (isMaximizingPlayer) {
    //         bestValue = -Infinity;
    //         for (let move of legalMoves) {
    //             const newPosition = new Position(currentPosition, move);
    //             const result = this.#alphaBeta(
    //                 newPosition,
    //                 depth - 1,
    //                 alpha,
    //                 beta,
    //                 false
    //             );
    //             if (result.value > bestValue) {
    //                 bestValue = result.value;
    //                 bestMove = move;
    //             }
    //             alpha = Math.max(alpha, bestValue);
    //             if (alpha >= beta) {
    //                 break; // Beta cut-off // is this fail-soft?
    //             }
    //         }
    //     } else {
    //         bestValue = Infinity;
    //         for (let move of legalMoves) {
    //             const newPosition = new Position(currentPosition, move);
    //             const result = this.#alphaBeta(
    //                 newPosition,
    //                 depth - 1,
    //                 alpha,
    //                 beta,
    //                 true
    //             );
    //             if (result.value < bestValue) {
    //                 bestValue = result.value;
    //                 bestMove = move;
    //             }
    //             beta = Math.min(beta, bestValue);
    //             if (alpha >= beta) {
    //                 break; // Alpha cut-off // is this fail-soft?
    //             }
    //         }
    //     }
    //     return { value: bestValue, move: bestMove };
    // }

    // #evaluate(position) {
    //     return Math.random() * 20 - 10;
    // }
}

export default Search;
