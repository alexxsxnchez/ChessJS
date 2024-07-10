import Piece from "./piece.js";
import { PieceType, PieceColour } from "./utils.js";

class Pawn extends Piece {
    constructor(color) {
        super(PieceType.PAWN, color);
    }

    getLegalMoves(board, row, col) {
        const moves = [];
        const direction = this.colour === PieceColour.WHITE ? 1 : -1;
        const startRow = this.colour === PieceColour.WHITE ? 1 : 6;
        const nextRow = row + direction;

        // moving forward
        if (!board.getPiece(nextRow, col)) {
            moves.push(board.getSquare(nextRow, col));

            // double move forward
            if (row === startRow) {
                const doubleMoveRow = nextRow + direction;
                if (!board.getPiece(doubleMoveRow, col)) {
                    moves.push(board.getSquare(doubleMoveRow, col));
                }
            }
        }

        // capture diagonally
        for (const offset of [-1, 1]) {
            const captureCol = col + offset;
            if (
                board.isValidPosition(nextRow, captureCol) &&
                board.getPiece(nextRow, captureCol)
            ) {
                if (
                    board.getPiece(nextRow, captureCol).getColour() !==
                    this.colour
                ) {
                    moves.push(board.getSquare(nextRow, captureCol));
                }
            }
        }

        return moves;
    }
}

export default Pawn;
