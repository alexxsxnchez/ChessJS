import Piece from "./piece.js";
import { PieceType } from "./utils.js";

class Queen extends Piece {
    constructor(color) {
        super(PieceType.QUEEN, color);
    }

    getAvailableMoves(pieceSquare, position) {
        return this.getAttackingMoves(pieceSquare, position);
    }

    getAttackingMoves(pieceSquare, position) {
        const moves = [];
        moves.push(...this.findDistanceMoves(pieceSquare, position, 0, 1));
        moves.push(...this.findDistanceMoves(pieceSquare, position, 0, -1));
        moves.push(...this.findDistanceMoves(pieceSquare, position, 1, 0));
        moves.push(...this.findDistanceMoves(pieceSquare, position, -1, 0));
        moves.push(...this.findDistanceMoves(pieceSquare, position, 1, 1));
        moves.push(...this.findDistanceMoves(pieceSquare, position, 1, -1));
        moves.push(...this.findDistanceMoves(pieceSquare, position, -1, 1));
        moves.push(...this.findDistanceMoves(pieceSquare, position, -1, -1));
        return moves;
    }
}

export default Queen;
