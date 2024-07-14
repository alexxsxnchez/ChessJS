import Piece from "./piece.js";
import { PieceColour, PieceType } from "./utils.js";
import { CastleMove, Move } from "../move.js";
import Square from "../square.js";
import { Position } from "../../State/position.js";

class King extends Piece {
    constructor(color) {
        super(PieceType.KING, color);
    }

    getAvailableMoves(pieceSquare, position) {
        const attackingSquares = this.getAttackingMoves(pieceSquare, position);
        const castlingMoves = this.#getCastlingMoves(pieceSquare, position);
        return attackingSquares.concat(castlingMoves);
    }

    getAttackingMoves(pieceSquare, position) {
        const moves = [];
        for (const rowOffset of [-1, 0, 1]) {
            for (const colOffset of [-1, 0, 1]) {
                if (rowOffset === 0 && colOffset === 0) {
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

    #getCastlingMoves(pieceSquare, position) {
        const moves = [];

        const kingsideRights =
            this.colour === PieceColour.WHITE
                ? position.whiteKingsideRights
                : position.blackKingsideRights;
        const kingsideOneStep = new Square(pieceSquare.row, 5);
        const kingsideTwoStep = new Square(pieceSquare.row, 6);

        const queensideRights =
            this.colour === PieceColour.WHITE
                ? position.whiteQueensideRights
                : position.blackQueensideRights;
        const queensideOneStep = new Square(pieceSquare.row, 3);
        const queensideTwoStep = new Square(pieceSquare.row, 2);
        const queensideThreeStep = new Square(pieceSquare.row, 1);

        // avoid calculating check if possible
        if (
            (!kingsideRights ||
                position.getPiece(kingsideOneStep) ||
                position.getPiece(kingsideTwoStep)) &&
            (!queensideRights ||
                position.getPiece(queensideOneStep) ||
                position.getPiece(queensideTwoStep) ||
                position.getPiece(queensideThreeStep))
        ) {
            return [];
        }

        if (position.isKingInCheck(this.colour)) {
            return [];
        }

        if (
            kingsideRights &&
            !position.getPiece(kingsideOneStep) &&
            !position.getPiece(kingsideTwoStep)
        ) {
            const moveOneSquare = new Move(pieceSquare, kingsideOneStep, this);
            const newPosition = new Position(position, moveOneSquare);
            if (!newPosition.isKingInCheck(this.colour)) {
                moves.push(
                    new CastleMove(
                        pieceSquare,
                        kingsideTwoStep,
                        this,
                        new Square(pieceSquare.row, 7)
                    )
                );
            }
        }

        if (
            queensideRights &&
            !position.getPiece(queensideOneStep) &&
            !position.getPiece(queensideTwoStep) &&
            !position.getPiece(queensideThreeStep)
        ) {
            if (!position.isKingInCheck(this.colour)) {
                const moveOneSquare = new Move(
                    pieceSquare,
                    queensideOneStep,
                    this
                );
                const newPosition = new Position(position, moveOneSquare);
                if (!newPosition.isKingInCheck(this.colour)) {
                    moves.push(
                        new CastleMove(
                            pieceSquare,
                            queensideTwoStep,
                            this,
                            new Square(pieceSquare.row, 0)
                        )
                    );
                }
            }
        }
        return moves;
    }
}

export default King;
