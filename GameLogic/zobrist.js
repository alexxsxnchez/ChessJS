import { PieceColour, PieceType } from "./piece.js";

class ZobristHash {
    constructor(lo = 0, hi = 0) {
        this.lo = lo;
        this.hi = hi;
    }

    toggle(otherHash) {
        this.lo ^= otherHash.lo;
        this.hi ^= otherHash.hi;
    }

    copy() {
        return new ZobristHash(this.lo, this.hi);
    }

    isEqual(otherHash) {
        return this.lo === otherHash.lo && this.hi === otherHash.hi;
    }
}

class Zobrist {
    /*
     * Using two 32 bit numbers for hash (lo, hi) for a combined 64 bits
     */
    constructor() {
        if (!Zobrist.instance) {
            this.pieceTable = new Array(64);
            for (let sq = 0; sq < 64; sq++) {
                this.pieceTable[sq] = new Array(12);
                for (let piece = 0; piece < 12; piece++) {
                    this.pieceTable[sq][piece] = new ZobristHash(
                        this.#getRandom32BitNumber(),
                        this.#getRandom32BitNumber()
                    );
                }
            }
            this.whiteKingsideRights = new ZobristHash(
                this.#getRandom32BitNumber(),
                this.#getRandom32BitNumber()
            );
            this.whiteQueensideRights = new ZobristHash(
                this.#getRandom32BitNumber(),
                this.#getRandom32BitNumber()
            );
            this.blackKingsideRights = new ZobristHash(
                this.#getRandom32BitNumber(),
                this.#getRandom32BitNumber()
            );
            this.blackQueensideRights = new ZobristHash(
                this.#getRandom32BitNumber(),
                this.#getRandom32BitNumber()
            );
            this.blackToMove = new ZobristHash(
                this.#getRandom32BitNumber(),
                this.#getRandom32BitNumber()
            );
            this.enPassantFiles = new Array(8);
            for (let i = 0; i < 8; i++) {
                this.enPassantFiles[i] = new ZobristHash(
                    this.#getRandom32BitNumber(),
                    this.#getRandom32BitNumber()
                );
            }
            Zobrist.instance = this;
        }
        return Zobrist.instance;
    }

    computeHash(position) {
        let hash = new ZobristHash();
        if (position.currentTurn === PieceColour.BLACK) {
            hash.toggle(this.blackToMove);
        }

        // en passant
        if (position.enPassantSquare) {
            const epFile = position.enPassantSquare % 8;
            hash.toggle(this.enPassantFiles[epFile]);
        }

        // castling rights
        if (!position.whiteKingsideRights) {
            hash.toggle(this.whiteKingsideRights);
        }
        if (!position.whiteQueensideRights) {
            hash.toggle(this.whiteQueensideRights);
        }
        if (!position.blackKingsideRights) {
            hash.toggle(this.blackKingsideRights);
        }
        if (!position.blackQueensideRights) {
            hash.toggle(this.blackQueensideRights);
        }

        // piece positions
        const allBB = position.sides[PieceColour.WHITE]
            .copy()
            .or(position.sides[PieceColour.BLACK]);

        while (!allBB.isEmpty()) {
            const sq = allBB.getLowestBitPosition();
            allBB.popLowestBit();
            const piece = position.getPiece(sq);
            const pieceIndex = this.getPieceIndex(piece.type, piece.colour);
            hash.toggle(this.pieceTable[sq][pieceIndex]);
        }
        return hash;
    }

    getPieceIndex(type, colour) {
        let index;
        switch (type) {
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
        if (colour === PieceColour.BLACK) {
            index += 6;
        }
        return index;
    }

    #getRandom32BitNumber() {
        return Math.floor(Math.random() * 2 ** 32);
    }
}

const zobrist = new Zobrist();
Object.freeze(zobrist);

export { zobrist, ZobristHash };
