import {
    PieceColour,
    PieceType,
} from "../GameManager/Immutable/Pieces/utils.js";
import {
    CastleMove,
    EnPassantMove,
    PromotionMove,
} from "../GameManager/Immutable/move.js";
import Position from "../GameManager/position.js";

class ZobristTable {
    /*
     * Using two 32 bit numbers for hash (lo, hi) for a combined 64 bits
     */
    #pieceTable;
    constructor() {
        this.#pieceTable = new Array(8);
        for (let row = 0; row < 8; row++) {
            this.#pieceTable[row] = new Array(8);
            for (let col = 0; col < 8; col++) {
                this.#pieceTable[row][col] = new Array(12);
                for (let piece = 0; piece < 12; piece++) {
                    this.#pieceTable[row][col][piece] = [
                        this.#getRandom32BitNumber(),
                        this.#getRandom32BitNumber(),
                    ];
                }
            }
        }
        this.whiteKingsideRights = [
            this.#getRandom32BitNumber(),
            this.#getRandom32BitNumber(),
        ];
        this.whiteQueensideRights = [
            this.#getRandom32BitNumber(),
            this.#getRandom32BitNumber(),
        ];
        this.blackKingsideRights = [
            this.#getRandom32BitNumber(),
            this.#getRandom32BitNumber(),
        ];
        this.blackQueensideRights = [
            this.#getRandom32BitNumber(),
            this.#getRandom32BitNumber(),
        ];
        this.blackToMove = [
            this.#getRandom32BitNumber(),
            this.#getRandom32BitNumber(),
        ];
        this.enPassantFiles = new Array(8);
        for (let i = 0; i < 8; i++) {
            this.enPassantFiles[i] = [
                this.#getRandom32BitNumber(),
                this.#getRandom32BitNumber(),
            ];
        }
    }

    computeHash(position) {
        let loH = 0;
        let hiH = 0;
        if (position.currentTurn === PieceColour.BLACK) {
            loH ^= this.blackToMove[0];
            hiH ^= this.blackToMove[1];
        }

        // en passant
        if (position.enPassantSquare) {
            loH ^= this.enPassantFiles[position.enPassantSquare.col][0];
            hiH ^= this.enPassantFiles[position.enPassantSquare.col][1];
        }

        // castling rights
        if (!position.whiteKingsideRights) {
            loH ^= this.whiteKingsideRights[0];
            hiH ^= this.whiteKingsideRights[1];
        }
        if (!position.whiteQueensideRights) {
            loH ^= this.whiteQueensideRights[0];
            hiH ^= this.whiteQueensideRights[1];
        }
        if (!position.blackKingsideRights) {
            loH ^= this.blackKingsideRights[0];
            hiH ^= this.blackKingsideRights[1];
        }
        if (!position.blackQueensideRights) {
            loH ^= this.blackQueensideRights[0];
            hiH ^= this.blackQueensideRights[1];
        }

        // piece positions
        for (let [pieceSquare, piece] of position.getPieceSquares()) {
            const pieceIndex = this.#getPieceIndex(piece);
            loH ^=
                this.#pieceTable[pieceSquare.row][pieceSquare.col][
                    pieceIndex
                ][0];
            hiH ^=
                this.#pieceTable[pieceSquare.row][pieceSquare.col][
                    pieceIndex
                ][1];
        }
        return [loH, hiH];
    }

    updateHash(loH, hiH, oldPosition, newPosition, move) {
        loH ^= this.blackToMove[0];
        hiH ^= this.blackToMove[1];

        // en passant
        if (oldPosition.enPassantSquare) {
            loH ^= this.enPassantFiles[oldPosition.enPassantSquare.col][0];
            hiH ^= this.enPassantFiles[oldPosition.enPassantSquare.col][1];
        }
        if (newPosition.enPassantSquare) {
            loH ^= this.enPassantFiles[newPosition.enPassantSquare.col][0];
            hiH ^= this.enPassantFiles[newPosition.enPassantSquare.col][1];
        }

        // castling rights
        if (
            oldPosition.whiteKingsideRights !== newPosition.whiteKingsideRights
        ) {
            loH ^= this.whiteKingsideRights[0];
            hiH ^= this.whiteKingsideRights[1];
        }
        if (
            oldPosition.whiteQueensideRights !==
            newPosition.whiteQueensideRights
        ) {
            loH ^= this.whiteQueensideRights[0];
            hiH ^= this.whiteQueensideRights[1];
        }
        if (
            oldPosition.blackKingsideRights !== newPosition.blackKingsideRights
        ) {
            loH ^= this.blackKingsideRights[0];
            hiH ^= this.blackKingsideRights[1];
        }
        if (
            oldPosition.blackQueensideRights !==
            newPosition.blackQueensideRights
        ) {
            loH ^= this.blackQueensideRights[0];
            hiH ^= this.blackQueensideRights[1];
        }

        const capturedPiece = oldPosition.getPiece(move.toSquare);
        if (capturedPiece) {
            const capturedPieceIndex = this.#getPieceIndex(capturedPiece);
            // XOR captured piece (except en passant)
            loH ^=
                this.#pieceTable[move.toSquare.row][move.toSquare.col][
                    capturedPieceIndex
                ][0];
            hiH ^=
                this.#pieceTable[move.toSquare.row][move.toSquare.col][
                    capturedPieceIndex
                ][1];
        }

        if (move instanceof CastleMove) {
            const originalRookSquare = move.originalRookSquare;
            const rook = oldPosition.getPiece(originalRookSquare);
            const rookIndex = this.#getPieceIndex(rook);
            // XOR old rook position
            loH ^=
                this.#pieceTable[originalRookSquare.row][
                    originalRookSquare.col
                ][rookIndex][0];
            hiH ^=
                this.#pieceTable[originalRookSquare.row][
                    originalRookSquare.col
                ][rookIndex][1];
            const newRookCol = move.toSquare.col === 2 ? 3 : 5;
            // XOR new rook position
            loH ^=
                this.#pieceTable[originalRookSquare.row][newRookCol][
                    rookIndex
                ][0];
            hiH ^=
                this.#pieceTable[originalRookSquare.row][newRookCol][
                    rookIndex
                ][1];
        } else if (move instanceof EnPassantMove) {
            const capturedPawnSquare = move.capturedPawnSquare;
            const capturedPawn = oldPosition.getPiece(capturedPawnSquare);
            const pawnIndex = this.#getPieceIndex(capturedPawn);
            // XOR captured pawn
            loH ^=
                this.#pieceTable[capturedPawnSquare.row][
                    capturedPawnSquare.col
                ][pawnIndex][0];
            hiH ^=
                this.#pieceTable[capturedPawnSquare.row][
                    capturedPawnSquare.col
                ][pawnIndex][1];
        }

        const pieceIndex = this.#getPieceIndex(move.piece);
        loH ^=
            this.#pieceTable[move.fromSquare.row][move.fromSquare.col][
                pieceIndex
            ][0];
        hiH ^=
            this.#pieceTable[move.fromSquare.row][move.fromSquare.col][
                pieceIndex
            ][1];
        if (move instanceof PromotionMove) {
            const promotionPiece = newPosition.getPiece(move.toSquare);
            const promotionPieceIndex = this.#getPieceIndex(promotionPiece);
            loH ^=
                this.#pieceTable[move.toSquare.row][move.toSquare.col][
                    promotionPieceIndex
                ][0];
            hiH ^=
                this.#pieceTable[move.toSquare.row][move.toSquare.col][
                    promotionPieceIndex
                ][1];
        } else {
            loH ^=
                this.#pieceTable[move.toSquare.row][move.toSquare.col][
                    pieceIndex
                ][0];
            hiH ^=
                this.#pieceTable[move.toSquare.row][move.toSquare.col][
                    pieceIndex
                ][1];
        }
        return [loH, hiH];
    }

    #getPieceIndex(piece) {
        let index;
        switch (piece.type) {
            case PieceType.BISHOP:
                index = 0;
                break;
            case PieceType.KING:
                index = 1;
                break;
            case PieceType.KNIGHT:
                index = 2;
                break;
            case PieceType.PAWN:
                index = 3;
                break;
            case PieceType.QUEEN:
                index = 4;
                break;
            case PieceType.ROOK:
                index = 5;
                break;
        }
        if (piece.colour === PieceColour.BLACK) {
            index += 6;
        }
        return index;
    }

    #getRandom32BitNumber() {
        return Math.floor(Math.random() * 2 ** 32);
    }
}

// class EnginePosition/* extends Position*/ {
//     #zobristHash;
//     position;

//     constructor(zobristTable, { position, oldEnginePosition, move }) {
//         if(position) {
//             this.position = position;
//             this.#initializeZobristHash(zobristTable);
//         } else if(!oldEnginePosition && !move) {
//             this.position = new Position(oldEnginePosition.position, move);
//             this.#updateZobristHash(zobristTable, oldEnginePosition, move);
//         }

//     }

//     constructor(zobristTable, oldEnginePosition = null, move = null) {
//         super(oldEnginePosition, move);
//         if (!oldEnginePosition && !move) {
//             this.#initializeZobristHash(zobristTable);
//         } else {
//             this.#updateZobristHash(zobristTable, oldEnginePosition, move);
//         }
//     }

//     static fromPosition(position) {

//     }

//     getZobristHash() {
//         return this.#zobristHash;
//     }

//     #initializeZobristHash(zobristTable) {
//         let h = 0;
//         // if(this.currentTurn === PieceColour.BLACK) {
//         //     h ^= zobristTable.blackToMove;
//         // }

//         for (let pieceSquare of this.position.getPieceSquares()) {
//             const piece = this.position.getPiece(pieceSquare);
//             const pieceIndex = zobristTable.getPieceIndex(piece);
//             h ^=
//                 zobristTable.pieceTable[pieceSquare.row][pieceSquare.col][
//                     pieceIndex
//                 ];
//         }
//         this.#zobristHash = h;
//     }

//     #updateZobristHash(zobristTable, oldPosition, move) {
//         let h = oldPosition.getZobristHash();
//         h ^= zobristTable.blackToMove;

//         // en passant
//         if (oldPosition.enPassantSquare) {
//             h ^= zobristTable.enPassantFiles[oldPosition.enPassantSquare.col];
//         }
//         if (this.enPassantSquare) {
//             h ^= zobristTable.enPassantFiles[this.enPassantSquare.col];
//         }

//         // castling rights
//         if (oldPosition.whiteKingsideRights !== this.whiteKingsideRights) {
//             h ^= zobristTable.whiteKingsideRights;
//         }
//         if (oldPosition.whiteQueensideRights !== this.whiteQueensideRights) {
//             h ^= zobristTable.whiteQueensideRights;
//         }
//         if (oldPosition.blackKingsideRights !== this.blackKingsideRights) {
//             h ^= zobristTable.blackKingsideRights;
//         }
//         if (oldPosition.blackQueensideRights !== this.blackQueensideRights) {
//             h ^= zobristTable.blackQueensideRights;
//         }

//         const capturedPiece = oldPosition.getPiece(move.toSquare);
//         if (capturedPiece) {
//             const capturedPieceIndex =
//                 zobristTable.getPieceIndex(capturedPiece);
//             // XOR captured piece (except en passant)
//             h ^=
//                 zobristTable.pieceTable[move.toSquare.row][move.toSquare.col][
//                     capturedPieceIndex
//                 ];
//         }

//         if (move instanceof CastleMove) {
//             const originalRookSquare = move.originalRookSquare;
//             const rook = oldPosition.getPiece(originalRookSquare);
//             const rookIndex = zobristTable.getPieceIndex(rook);
//             // XOR old rook position
//             h ^=
//                 zobristTable.pieceTable[originalRookSquare.row][
//                     originalRookSquare.col
//                 ][rookIndex];
//             const newRookCol = move.toSquare.col === 2 ? 3 : 5;
//             // XOR new rook position
//             h ^=
//                 zobristTable.pieceTable[originalRookSquare.row][newRookCol][
//                     rookIndex
//                 ];
//         } else if (move instanceof EnPassantMove) {
//             const capturedPawnSquare = move.capturedPawnSquare;
//             const capturedPawn = oldPosition.getPiece(capturedPawnSquare);
//             const pawnIndex = zobristTable.getPieceIndex(capturedPawn);
//             // XOR captured pawn
//             h ^=
//                 zobristTable.pieceTable[capturedPawnSquare.row][
//                     capturedPawnSquare.col
//                 ][pawnIndex];
//         }

//         const pieceIndex = zobristTable.getPieceIndex(move.piece);
//         h ^=
//             zobristTable.pieceTable[move.fromSquare.row][move.fromSquare.col][
//                 pieceIndex
//             ];
//         if (move instanceof PromotionMove) {
//             const promotionPiece = this.getPiece(move.toSquare);
//             const promotionPieceIndex =
//                 zobristTable.getPieceIndex(promotionPiece);
//             h ^=
//                 zobristTable.pieceTable[move.toSquare.row][move.toSquare.col][
//                     promotionPieceIndex
//                 ];
//         } else {
//             h ^=
//                 zobristTable.pieceTable[move.toSquare.row][move.toSquare.col][
//                     pieceIndex
//                 ];
//         }

//         this.#zobristHash = h;
//     }
// }

export default ZobristTable;
