import Piece from "./piece.js";
import { PieceType } from "./utils.js";
import { Move } from "../move.js";
import Square from "../square.js";

class Knight extends Piece {
    constructor(colour) {
        super(PieceType.KNIGHT, colour);
    }

    getAvailableMoves(pieceSquare, position) {
        return this.getAttackingMoves(pieceSquare, position);
    }

    getAttackingMoves(pieceSquare, position) {
        const moves = [];
        for (const rowOffset of [-2, -1, 1, 2]) {
            for (const colOffset of [-2, -1, 1, 2]) {
                if (Math.abs(rowOffset) === Math.abs(colOffset)) {
                    continue;
                }
                const row = pieceSquare.row + rowOffset;
                const col = pieceSquare.col + colOffset;
                if (row >= 0 && row < 8 && col >= 0 && col < 8) {
                    const toSquare = new Square(row, col);
                    const otherPiece = position.getPiece(toSquare);
                    if (!otherPiece || otherPiece.colour !== this.colour) {
                        moves.push(new Move(pieceSquare, toSquare, this));
                    }
                }
            }
        }
        return moves;
    }
}

export default Knight;
