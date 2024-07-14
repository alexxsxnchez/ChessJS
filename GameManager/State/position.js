import { PieceColour, PieceType } from "../Immutable/Pieces/utils.js";
import { CastleMove, PromotionMove, EnPassantMove } from "../Immutable/move.js";
import Square from "../Immutable/square.js";
import Bishop from "../Immutable/Pieces/bishop.js";
import King from "../Immutable/Pieces/king.js";
import Knight from "../Immutable/Pieces/knight.js";
import Pawn from "../Immutable/Pieces/pawn.js";
import Queen from "../Immutable/Pieces/queen.js";
import Rook from "../Immutable/Pieces/rook.js";

const BOARD_SIZE = 8;
// TODO - can be updated to remove nulls to save space
const INITIAL_PIECES = [
    [
        [PieceType.ROOK, PieceColour.WHITE],
        [PieceType.KNIGHT, PieceColour.WHITE],
        [PieceType.BISHOP, PieceColour.WHITE],
        [PieceType.QUEEN, PieceColour.WHITE],
        [PieceType.KING, PieceColour.WHITE],
        [PieceType.BISHOP, PieceColour.WHITE],
        [PieceType.KNIGHT, PieceColour.WHITE],
        [PieceType.ROOK, PieceColour.WHITE],
    ],
    Array(BOARD_SIZE).fill([PieceType.PAWN, PieceColour.WHITE]),
    ...Array(4).fill(Array(BOARD_SIZE).fill(null)),
    Array(BOARD_SIZE).fill([PieceType.PAWN, PieceColour.BLACK]),
    [
        [PieceType.ROOK, PieceColour.BLACK],
        [PieceType.KNIGHT, PieceColour.BLACK],
        [PieceType.BISHOP, PieceColour.BLACK],
        [PieceType.QUEEN, PieceColour.BLACK],
        [PieceType.KING, PieceColour.BLACK],
        [PieceType.BISHOP, PieceColour.BLACK],
        [PieceType.KNIGHT, PieceColour.BLACK],
        [PieceType.ROOK, PieceColour.BLACK],
    ],
];

// helper data structure
class PieceMap {
    #whitePieces;
    #blackPieces;
    constructor() {
        this.#whitePieces = new Map();
        this.#blackPieces = new Map();
    }

    add(square, piece) {
        if (piece.colour === PieceColour.WHITE) {
            this.#whitePieces.set(square.toString(), piece);
        } else {
            this.#blackPieces.set(square.toString(), piece);
        }
    }

    get(square) {
        return (
            this.#whitePieces.get(square.toString()) ||
            this.#blackPieces.get(square.toString()) ||
            null
        );
    }

    remove(square) {
        this.#whitePieces.delete(square.toString());
        this.#blackPieces.delete(square.toString());
    }

    getEntries(colour = null) {
        const entries = [];
        if (!colour || colour === PieceColour.WHITE) {
            for (let [squareString, piece] of this.#whitePieces.entries()) {
                entries.push([Square.fromString(squareString), piece]);
            }
        }
        if (!colour || colour === PieceColour.BLACK) {
            for (let [squareString, piece] of this.#blackPieces.entries()) {
                entries.push([Square.fromString(squareString), piece]);
            }
        }
        return entries;
    }
}

class Position {
    // calculationCache used to cache expensive operations like:
    // isWhiteInCheck, isBlackInCheck, doLegalMovesExist
    #calculationCache;
    #currentTurn;
    enPassantSquare;
    whiteKingsideRights;
    whiteQueensideRights;
    blackKingsideRights;
    blackQueensideRights;
    #pieceLocations;
    #whiteKingSquare;
    #blackKingSquare;
    constructor(oldPosition = null, move = null) {
        if (!oldPosition && !move) {
            this.#createStarting();
        } else if (oldPosition && move) {
            this.#createFromOldPosition(oldPosition, move);
        } else {
            throw new Error("invalid position input");
        }
    }

    getCurrentTurn() {
        return this.#currentTurn;
    }

    getPiece(square) {
        return this.#pieceLocations.get(square);
    }

    getPieceSquares(colour = null) {
        return this.#pieceLocations.getEntries(colour);
    }

    isKingInCheck(colour = this.#currentTurn) {
        const cacheValue =
            colour === PieceColour.WHITE
                ? this.#calculationCache.isWhiteInCheck
                : this.#calculationCache.isBlackInCheck;
        if (cacheValue !== null) {
            return cacheValue;
        }

        const kingSquare =
            colour === PieceColour.WHITE
                ? this.#whiteKingSquare
                : this.#blackKingSquare;

        const oppositeColour =
            colour === PieceColour.WHITE
                ? PieceColour.BLACK
                : PieceColour.WHITE;
        for (let [opponentSquare, opponentPiece] of this.getPieceSquares(
            oppositeColour
        )) {
            const attackingMoves = opponentPiece.getAttackingMoves(
                opponentSquare,
                this
            );
            for (let attackingMove of attackingMoves) {
                if (attackingMove.toSquare.equals(kingSquare)) {
                    if (colour === PieceColour.WHITE) {
                        this.#calculationCache.isWhiteInCheck = true;
                    } else {
                        this.#calculationCache.isBlackInCheck = true;
                    }
                    return true;
                }
            }
        }

        if (colour === PieceColour.WHITE) {
            this.#calculationCache.isWhiteInCheck = false;
        } else {
            this.#calculationCache.isBlackInCheck = false;
        }
        return false;
    }

    isMoveLegal(move) {
        if (move.piece.colour === this.#currentTurn) {
            const availableMoves = move.piece.getAvailableMoves(
                move.fromSquare,
                this
            );
            for (let availableMove of availableMoves) {
                if (move.equals(availableMove)) {
                    const newPosition = new Position(this, move);
                    return !newPosition.isKingInCheck(move.piece.colour);
                }
            }
        }
        return false;
    }

    doLegalMovesExist() {
        if (this.#calculationCache.doLegalMovesExist !== null) {
            return this.#calculationCache.doLegalMovesExist;
        }

        for (let [pieceSquare, piece] of this.getPieceSquares(
            this.#currentTurn
        )) {
            const availableMoves = piece.getAvailableMoves(pieceSquare, this);
            for (let availableMove of availableMoves) {
                const newPosition = new Position(this, availableMove);
                if (!newPosition.isKingInCheck(piece.colour)) {
                    this.#calculationCache.doLegalMovesExist = true;
                    return true;
                }
            }
        }
        this.#calculationCache.doLegalMovesExist = false;
        return false;
    }

    getLegalMoves(pieceSquare, piece) {
        const legalMoves = [];
        const moves = piece.getAvailableMoves(pieceSquare, this);
        for (let move of moves) {
            const newPosition = new Position(this, move);
            if (!newPosition.isKingInCheck(piece.colour)) {
                legalMoves.push(move);
            }
        }
        return legalMoves;
    }

    #createStarting() {
        this.#calculationCache = {
            isWhiteInCheck: false,
            isBlackInCheck: false,
            doLegalMovesExist: true,
        };
        this.#currentTurn = PieceColour.WHITE;
        this.enPassantSquare = null;
        this.whiteKingsideRights = true;
        this.whiteQueensideRights = true;
        this.blackKingsideRights = true;
        this.blackQueensideRights = true;
        this.#pieceLocations = new PieceMap();
        this.#initializeBoard();
    }

    #createFromOldPosition(oldPosition, move) {
        this.#calculationCache = {
            isWhiteInCheck: null,
            isBlackInCheck: null,
            doLegalMovesExist: null,
        };
        this.#currentTurn =
            oldPosition.#currentTurn === PieceColour.WHITE
                ? PieceColour.BLACK
                : PieceColour.WHITE;
        this.enPassantSquare = this.#getEnPassantSquare(move);
        this.#updateCastlingRights(oldPosition, move);

        this.#pieceLocations = new PieceMap();

        if (move instanceof PromotionMove) {
            this.#createPiece(move.promotionType, move.colour, move.toSquare);
        } else {
            this.#createPiece(
                move.piece.type,
                move.piece.colour,
                move.toSquare
            );

            if (move instanceof CastleMove) {
                const newRookCol = move.toSquare.col === 2 ? 3 : 5;
                this.#createPiece(
                    PieceType.ROOK,
                    move.piece.colour,
                    new Square(move.toSquare.row, newRookCol)
                );
            }
        }
        for (let [square, oldPiece] of oldPosition.getPieceSquares()) {
            // Do not copy certain pieces
            if (
                square.equals(move.fromSquare) ||
                square.equals(move.toSquare) ||
                (move instanceof CastleMove &&
                    square.equals(move.originalRookSquare)) ||
                (move instanceof EnPassantMove &&
                    square.equals(move.capturedPawnSquare))
            ) {
                continue;
            }
            this.#createPiece(oldPiece.type, oldPiece.colour, square);
        }
    }

    #updateCastlingRights(oldPosition, move) {
        this.whiteKingsideRights = oldPosition.whiteKingsideRights;
        this.whiteQueensideRights = oldPosition.whiteQueensideRights;
        this.blackKingsideRights = oldPosition.blackKingsideRights;
        this.blackQueensideRights = oldPosition.blackQueensideRights;
        if (move.piece.type === PieceType.KING) {
            if (move.piece.colour === PieceColour.WHITE) {
                this.whiteKingsideRights = false;
                this.whiteQueensideRights = false;
            } else {
                this.blackKingsideRights = false;
                this.blackQueensideRights = false;
            }
        } else if (move.piece.type === PieceType.ROOK) {
            if (move.piece.colour === PieceColour.WHITE) {
                if (move.fromSquare.col === 0) {
                    this.whiteQueensideRights = false;
                } else if (move.fromSquare.col === 7) {
                    this.whiteKingsideRights = false;
                }
            } else {
                if (move.fromSquare.col === 0) {
                    this.blackQueensideRights = false;
                } else if (move.fromSquare.col === 7) {
                    this.blackKingsideRights = false;
                }
            }
        }
    }

    #getEnPassantSquare(move) {
        if (
            move.piece.type === PieceType.PAWN &&
            move.fromSquare.col === move.toSquare.col
        ) {
            if (
                move.piece.colour === PieceColour.WHITE &&
                move.fromSquare.row === 1 &&
                move.toSquare.row === 3
            ) {
                return new Square(2, move.fromSquare.col);
            } else if (
                move.piece.colour === PieceColour.BLACK &&
                move.fromSquare.row === 6 &&
                move.toSquare.row === 4
            ) {
                return new Square(5, move.fromSquare.col);
            }
        }
        return null;
    }

    #initializeBoard() {
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                const pieceConfig = INITIAL_PIECES[row][col];
                if (pieceConfig) {
                    this.#createPiece(...pieceConfig, new Square(row, col));
                }
            }
        }
    }

    #createPiece(type, colour, square) {
        let piece;
        switch (type) {
            case PieceType.BISHOP:
                piece = new Bishop(colour);
                break;
            case PieceType.KING:
                piece = new King(colour);
                if (colour === PieceColour.WHITE) {
                    this.#whiteKingSquare = square;
                } else {
                    this.#blackKingSquare = square;
                }
                break;
            case PieceType.KNIGHT:
                piece = new Knight(colour);
                break;
            case PieceType.PAWN:
                piece = new Pawn(colour);
                break;
            case PieceType.QUEEN:
                piece = new Queen(colour);
                break;
            case PieceType.ROOK:
                piece = new Rook(colour);
                break;
            default:
                throw new Error("invalid type");
        }
        this.#pieceLocations.add(square, piece);
        return piece;
    }
}

export { Position, Square };
