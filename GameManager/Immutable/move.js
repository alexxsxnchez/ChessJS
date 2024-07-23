import { PieceType } from "./Pieces/utils.js";

class Move {
    constructor(fromSquare, toSquare, piece) {
        this.fromSquare = fromSquare;
        this.toSquare = toSquare;
        this.piece = piece;
    }

    equals(other) {
        return (
            this.constructor.name === other.constructor.name &&
            this.fromSquare.equals(other.fromSquare) &&
            this.toSquare.equals(other.toSquare) &&
            this.piece.equals(other.piece)
        );
    }

    toJSON() {
        let s = "";
        switch (this.piece.type) {
            case PieceType.KNIGHT:
                s += "N";
                break;
            case PieceType.BISHOP:
                s += "B";
                break;
            case PieceType.ROOK:
                s += "R";
                break;
            case PieceType.QUEEN:
                s += "Q";
                break;
            case PieceType.KING:
                s += "K";
                break;
        }
        const fromFile = String.fromCharCode(this.fromSquare.col + 65);
        const toFile = String.fromCharCode(this.toSquare.col + 65);
        s +=
            fromFile +
            (this.fromSquare.row + 1) +
            toFile +
            (this.toSquare.row + 1);
        return s;
    }
}

class PromotionMove extends Move {
    constructor(fromSquare, toSquare, piece, promotionType) {
        super(fromSquare, toSquare, piece);
        this.promotionType = promotionType;
    }

    equals(other) {
        return (
            this.promotionType === other.promotionType && super.equals(other)
        );
    }
}

class CastleMove extends Move {
    constructor(fromSquare, toSquare, piece, originalRookSquare) {
        super(fromSquare, toSquare, piece);
        this.originalRookSquare = originalRookSquare;
    }

    equals(other) {
        return (
            this.originalRookSquare.equals(other.originalRookSquare) &&
            super.equals(other)
        );
    }
}

class EnPassantMove extends Move {
    constructor(fromSquare, toSquare, piece, capturedPawnSquare) {
        super(fromSquare, toSquare, piece);
        this.capturedPawnSquare = capturedPawnSquare;
    }

    equals(other) {
        return (
            this.capturedPawnSquare.equals(other.capturedPawnSquare) &&
            super.equals(other)
        );
    }
}

export { Move, PromotionMove, CastleMove, EnPassantMove };
