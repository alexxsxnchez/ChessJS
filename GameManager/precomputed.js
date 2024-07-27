import { PieceColour } from "./Immutable/Pieces/utils.js";
import Bitboard from "./bitboard.js";

class Precomputed {
    constructor() {
        if (!Precomputed.instance) {
            this.#init();
            Precomputed.instance = this;
        }
        return Precomputed.instance;
    }

    #init() {
        this.#initFilesAndRanksBB();
        this.#initPieceMovementBB();
    }

    #initFilesAndRanksBB() {
        this.FILES = Array.from(Array(8), (_, file) => {
            return new Bitboard(0x01010101, 0x01010101).shiftL(file);
        });

        this.RANKS = Array.from(Array(8), (_, rank) => {
            return new Bitboard(0xff, 0).shiftL(8 * rank);
        });
    }

    #initPieceMovementBB() {
        this.PAWN_ATTACKS = Array.from(Array(2), (_, colour) =>
            Array.from(Array(64), (_, sq) => {
                if (sq < 8 || sq >= 56) {
                    return new Bitboard();
                }
                return this.#pawnAttacksBB(colour, sq);
            })
        );
        this.KNIGHT_MOVEMENTS = Array.from(Array(64), (_, sq) =>
            this.#knightMovementBB(sq)
        );
        // this.BISHOP_MOVEMENTS = Array.from(Array(64), (_, sq) =>
        //     this.#bishopMovementBB(i)
        // );
        // this.ROOK_MOVEMENTS = Array.from(Array(64), (_, sq) =>
        //     this.#rookMovementBB(i)
        // );
        // this.QUEEN_MOVEMENTS = Array.from(Array(64), (_, sq) =>
        //     this.#queenMovementBB(i)
        // );
        this.KING_MOVEMENTS = Array.from(Array(64), (_, sq) =>
            this.#kingMovementBB(sq)
        );
    }

    #pawnAttacksBB(colour, sq) {
        const bb = new Bitboard().setBit(sq);
        const leftFile = this.FILES[colour === PieceColour.WHITE ? 0 : 7];
        const rightFile = this.FILES[colour === PieceColour.WHITE ? 7 : 0];
        const rankDir = colour === PieceColour.WHITE ? 8 : -8;
        const leftDir = colour === PieceColour.WHITE ? -1 : 1;
        const leftAttacksBB = bb
            .copy()
            .andNot(leftFile)
            .shiftL(rankDir + leftDir);
        const rightAttacksBB = bb
            .copy()
            .andNot(rightFile)
            .shiftL(rankDir - leftDir);
        return leftAttacksBB.or(rightAttacksBB);
    }

    #knightMovementBB(sq) {
        const bb = new Bitboard().setBit(sq);
        const oneFileLeft = bb.copy().shiftR(1).andNot(this.FILES[7]);
        const twoFilesLeft = bb
            .copy()
            .shiftR(2)
            .andNot(this.FILES[7])
            .andNot(this.FILES[[6]]);
        const oneFileRight = bb.copy().shiftL(1).andNot(this.FILES[0]);
        const twoFilesRight = bb
            .copy()
            .shiftL(2)
            .andNot(this.FILES[0])
            .andNot(this.FILES[1]);
        const oneFileAway = oneFileLeft.or(oneFileRight);
        const twoFilesAway = twoFilesLeft.or(twoFilesRight);
        return oneFileAway
            .copy()
            .shiftL(16)
            .or(oneFileAway.shiftR(16))
            .or(twoFilesAway.copy().shiftL(8))
            .or(twoFilesAway.shiftR(8));
    }
    // #bishopMovementBB(sq) {}
    // #rookMovementBB(sq) {}
    // #queenMovementBB(sq) {}
    #kingMovementBB(sq) {
        const bb = new Bitboard().setBit(sq);
        const left = bb.copy().shiftR(1).andNot(this.FILES[7]);
        const right = bb.copy().shiftL(1).andNot(this.FILES[0]);
        const leftToRight = bb.or(left).or(right);
        const up = leftToRight.copy().shiftL(8);
        const down = leftToRight.copy().shiftR(8);
        return leftToRight.or(up).or(down);
    }
}

const instance = new Precomputed();
Object.freeze(instance);

export default instance;
