import Piece from "./piece.js";
import { PieceType } from "./utils.js";

class Bishop extends Piece {
    constructor(colour) {
        super(PieceType.BISHOP, colour);
    }

    getAvailableMoves(pieceSquare, position) {
        return this.getAttackingMoves(pieceSquare, position);
    }

    getAttackingMoves(pieceSquare, position) {
        const moves = [];
        moves.push(...this.findDistanceMoves(pieceSquare, position, 1, 1));
        moves.push(...this.findDistanceMoves(pieceSquare, position, 1, -1));
        moves.push(...this.findDistanceMoves(pieceSquare, position, -1, 1));
        moves.push(...this.findDistanceMoves(pieceSquare, position, -1, -1));
        return moves;
    }
}

export default Bishop;
