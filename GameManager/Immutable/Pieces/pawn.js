import Piece from "./piece.js";
import { PieceType, PieceColour } from "./utils.js";
import { EnPassantMove, PromotionMove, Move } from "../move.js";
import Square from "../square.js";

class Pawn extends Piece {
    constructor(color) {
        super(PieceType.PAWN, color);
    }

    getAvailableMoves(pieceSquare, position) {
        const normalMoves = this.#getNormalMoves(pieceSquare, position);
        const attackingMoves = this.getAttackingMoves(pieceSquare, position);
        const enPassantMoves = this.#getEnPassantMoves(pieceSquare, position);
        return normalMoves.concat(attackingMoves).concat(enPassantMoves);
    }

    getAttackingMoves(pieceSquare, position) {
        const moves = [];
        const direction = this.colour === PieceColour.WHITE ? 1 : -1;
        const row = pieceSquare.row + direction;
        for (const offset of [-1, 1]) {
            const col = pieceSquare.col + offset;
            if (row >= 0 && row < 8 && col >= 0 && col < 8) {
                const captureSquare = new Square(row, col);
                const otherPiece = position.getPiece(captureSquare);
                if (otherPiece && otherPiece.colour !== this.colour) {
                    if (row === 7 || row === 0) {
                        for (let pieceType of [
                            PieceType.QUEEN,
                            PieceType.KNIGHT,
                            PieceType.ROOK,
                            PieceType.BISHOP,
                        ]) {
                            moves.push(
                                new PromotionMove(
                                    pieceSquare,
                                    captureSquare,
                                    this,
                                    pieceType
                                )
                            );
                        }
                    } else {
                        moves.push(new Move(pieceSquare, captureSquare, this));
                    }
                }
            }
        }
        return moves;
    }

    #getNormalMoves(pieceSquare, position) {
        const moves = [];
        const direction = this.colour === PieceColour.WHITE ? 1 : -1;
        const row = pieceSquare.row + direction;
        if (row >= 0 && row < 8) {
            const toSquare = new Square(row, pieceSquare.col);
            if (!position.getPiece(toSquare)) {
                if (row === 7 || row === 0) {
                    for (let pieceType of [
                        PieceType.QUEEN,
                        PieceType.KNIGHT,
                        PieceType.ROOK,
                        PieceType.BISHOP,
                    ]) {
                        moves.push(
                            new PromotionMove(
                                pieceSquare,
                                toSquare,
                                this,
                                pieceType
                            )
                        );
                    }
                } else {
                    moves.push(new Move(pieceSquare, toSquare, this));
                    // double move forward
                    const startRow = this.colour === PieceColour.WHITE ? 1 : 6;
                    if (pieceSquare.row === startRow) {
                        const doubleMoveSquare = new Square(
                            row + direction,
                            pieceSquare.col
                        );
                        if (!position.getPiece(doubleMoveSquare)) {
                            moves.push(
                                new Move(pieceSquare, doubleMoveSquare, this)
                            );
                        }
                    }
                }
            }
        }
        return moves;
    }

    #getEnPassantMoves(pieceSquare, position) {
        if (position.enPassantSquare) {
            const oneStep = this.colour === PieceColour.WHITE ? 1 : -1;
            if (position.enPassantSquare.row === pieceSquare.row + oneStep) {
                for (let offset of [-1, 1]) {
                    if (
                        position.enPassantSquare.col ===
                        pieceSquare.col + offset
                    ) {
                        return [
                            new EnPassantMove(
                                pieceSquare,
                                position.enPassantSquare,
                                this,
                                new Square(
                                    pieceSquare.row,
                                    position.enPassantSquare.col
                                )
                            ),
                        ];
                    }
                }
            }
        }
        return [];
    }
}

export default Pawn;
