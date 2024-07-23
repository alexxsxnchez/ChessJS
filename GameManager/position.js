import { PieceColour, PieceType } from "./Immutable/Pieces/utils.js";
import { CastleMove, PromotionMove, EnPassantMove } from "./Immutable/move.js";
import Square from "./Immutable/square.js";
import Bishop from "./Immutable/Pieces/bishop.js";
import King from "./Immutable/Pieces/king.js";
import Knight from "./Immutable/Pieces/knight.js";
import Pawn from "./Immutable/Pieces/pawn.js";
import Queen from "./Immutable/Pieces/queen.js";
import Rook from "./Immutable/Pieces/rook.js";

const STARTING_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
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
    // whitePieces;
    // blackPieces;
    constructor() {
        this.whitePieces = new Map();
        this.blackPieces = new Map();
    }

    add(square, piece) {
        if (piece.colour === PieceColour.WHITE) {
            this.whitePieces.set(square.toString(), piece);
        } else {
            this.blackPieces.set(square.toString(), piece);
        }
    }

    get(square) {
        return (
            this.whitePieces.get(square.toString()) ||
            this.blackPieces.get(square.toString()) ||
            null
        );
    }

    remove(square) {
        this.whitePieces.delete(square.toString());
        this.blackPieces.delete(square.toString());
    }

    getEntries(colour = null) {
        const entries = [];
        if (!colour || colour === PieceColour.WHITE) {
            for (let [squareString, piece] of this.whitePieces.entries()) {
                entries.push([Square.fromString(squareString), piece]);
            }
        }
        if (!colour || colour === PieceColour.BLACK) {
            for (let [squareString, piece] of this.blackPieces.entries()) {
                entries.push([Square.fromString(squareString), piece]);
            }
        }
        return entries;
    }
}

class Position {
    // calculationCache used to cache expensive operations like:
    // isWhiteInCheck, isBlackInCheck, doLegalMovesExist
    // calculationCache;
    // currentTurn;
    // lastMove;
    // enPassantSquare;
    // whiteKingsideRights;
    // whiteQueensideRights;
    // blackKingsideRights;
    // blackQueensideRights;
    // pieceLocations;
    // whiteKingSquare;
    // blackKingSquare;
    constructor(oldPosition = null, move = null) {
        if (typeof oldPosition === "string") {
            this.#createFromFEN(oldPosition);
        } else if (!oldPosition && !move) {
            this.#createStarting();
        } else if (oldPosition && move) {
            this.#createFromOldPosition(oldPosition, move);
        } else if (oldPosition && !move) {
            // copy from oldPosition
            this.calculationCache = oldPosition.calculationCache;
            this.currentTurn = oldPosition.currentTurn;
            //this.lastMove =
            this.enPassantSquare = oldPosition.enPassantSquare
                ? new Square(
                      oldPosition.enPassantSquare.row,
                      oldPosition.enPassantSquare.col
                  )
                : null;
            this.whiteKingsideRights = oldPosition.whiteKingsideRights;
            this.whiteQueensideRights = oldPosition.whiteQueensideRights;
            this.blackKingsideRights = oldPosition.blackKingsideRights;
            this.blackQueensideRights = oldPosition.blackQueensideRights;
            this.pieceLocations = new PieceMap();
            for (let [
                squareString,
                piece,
            ] of oldPosition.pieceLocations.whitePieces.entries()) {
                this.#createPiece(
                    piece.type,
                    piece.colour,
                    Square.fromString(squareString)
                );
            }
            for (let [
                squareString,
                piece,
            ] of oldPosition.pieceLocations.blackPieces.entries()) {
                this.#createPiece(
                    piece.type,
                    piece.colour,
                    Square.fromString(squareString)
                );
            }

            this.whiteKingSquare = oldPosition.whiteKingSquare;
            this.blackKingSquare = oldPosition.blackKingSquare;
        } else {
            throw new Error("invalid position input");
        }
    }

    getPiece(square) {
        return this.pieceLocations.get(square);
    }

    getPieceSquares(colour = null) {
        return this.pieceLocations.getEntries(colour);
    }

    isKingInCheck(colour = this.currentTurn) {
        const cacheValue =
            colour === PieceColour.WHITE
                ? this.calculationCache.isWhiteInCheck
                : this.calculationCache.isBlackInCheck;
        if (cacheValue !== null) {
            return cacheValue;
        }

        const kingSquare =
            colour === PieceColour.WHITE
                ? this.whiteKingSquare
                : this.blackKingSquare;

        for (let [opponentSquare, opponentPiece] of this.getPieceSquares(
            PieceColour.getOpposite(colour)
        )) {
            const attackingMoves = opponentPiece.getAttackingMoves(
                opponentSquare,
                this
            );
            for (let attackingMove of attackingMoves) {
                if (attackingMove.toSquare.equals(kingSquare)) {
                    if (colour === PieceColour.WHITE) {
                        this.calculationCache.isWhiteInCheck = true;
                    } else {
                        this.calculationCache.isBlackInCheck = true;
                    }
                    return true;
                }
            }
        }

        if (colour === PieceColour.WHITE) {
            this.calculationCache.isWhiteInCheck = false;
        } else {
            this.calculationCache.isBlackInCheck = false;
        }
        return false;
    }

    isMoveLegal(move) {
        if (move.piece.colour === this.currentTurn) {
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
        if (this.calculationCache.doLegalMovesExist !== null) {
            return this.calculationCache.doLegalMovesExist;
        }

        for (let [pieceSquare, piece] of this.getPieceSquares(
            this.currentTurn
        )) {
            const availableMoves = piece.getAvailableMoves(pieceSquare, this);
            for (let availableMove of availableMoves) {
                const newPosition = new Position(this, availableMove);
                if (!newPosition.isKingInCheck(piece.colour)) {
                    this.calculationCache.doLegalMovesExist = true;
                    return true;
                }
            }
        }
        this.calculationCache.doLegalMovesExist = false;
        return false;
    }

    getLegalMovesForPiece(pieceSquare, piece) {
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

    getLegalMoves() {
        const legalMoves = [];
        for (let [pieceSquare, piece] of this.getPieceSquares(
            this.currentTurn
        )) {
            legalMoves.push(...this.getLegalMovesForPiece(pieceSquare, piece));
        }
        return legalMoves;
    }

    #createStarting() {
        this.calculationCache = {
            isWhiteInCheck: false,
            isBlackInCheck: false,
            doLegalMovesExist: true,
        };
        this.currentTurn = PieceColour.WHITE;
        this.lastMove = null;
        this.enPassantSquare = null;
        this.whiteKingsideRights = true;
        this.whiteQueensideRights = true;
        this.blackKingsideRights = true;
        this.blackQueensideRights = true;
        this.pieceLocations = new PieceMap();
        this.#initializeBoard();
    }

    #createFromOldPosition(oldPosition, move) {
        this.calculationCache = {
            isWhiteInCheck: null,
            isBlackInCheck: null,
            doLegalMovesExist: null,
        };
        this.currentTurn = PieceColour.getOpposite(oldPosition.currentTurn);
        this.lastMove = move;
        this.enPassantSquare = this.#getEnPassantSquare(move);
        this.#updateCastlingRights(oldPosition, move);

        this.pieceLocations = new PieceMap();

        if (move instanceof PromotionMove) {
            this.#createPiece(
                move.promotionType,
                move.piece.colour,
                move.toSquare
            );
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
        // if any piece on the board move into rook squares (captures rook)
        if (move.toSquare.row === 0 && move.toSquare.col === 0) {
            this.whiteQueensideRights = false;
        } else if (move.toSquare.row === 0 && move.toSquare.col === 7) {
            this.whiteKingsideRights = false;
        } else if (move.toSquare.row === 7 && move.toSquare.col === 0) {
            this.blackQueensideRights = false;
        } else if (move.toSquare.row === 7 && move.toSquare.col === 7) {
            this.blackKingsideRights = false;
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
                    this.whiteKingSquare = square;
                } else {
                    this.blackKingSquare = square;
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
        this.pieceLocations.add(square, piece);
        return piece;
    }

    #createFromFEN(fen) {
        this.calculationCache = {
            isWhiteInCheck: false,
            isBlackInCheck: false,
            doLegalMovesExist: true,
        };
        this.lastMove = null;
        this.pieceLocations = new PieceMap();

        const components = fen.split(" ");
        const pieces = components[0];
        let row = 7;
        let col = 0;
        for (let i = 0; i <= pieces.length; i++) {
            const ch = pieces[i];
            switch (ch) {
                case "p":
                    this.#createPiece(
                        PieceType.PAWN,
                        PieceColour.BLACK,
                        new Square(row, col)
                    );
                    col++;
                    break;
                case "n":
                    this.#createPiece(
                        PieceType.KNIGHT,
                        PieceColour.BLACK,
                        new Square(row, col)
                    );
                    col++;
                    break;
                case "b":
                    this.#createPiece(
                        PieceType.BISHOP,
                        PieceColour.BLACK,
                        new Square(row, col)
                    );
                    col++;
                    break;
                case "r":
                    this.#createPiece(
                        PieceType.ROOK,
                        PieceColour.BLACK,
                        new Square(row, col)
                    );
                    col++;
                    break;
                case "q":
                    this.#createPiece(
                        PieceType.QUEEN,
                        PieceColour.BLACK,
                        new Square(row, col)
                    );
                    col++;
                    break;
                case "k":
                    this.#createPiece(
                        PieceType.KING,
                        PieceColour.BLACK,
                        new Square(row, col)
                    );
                    col++;
                    break;
                case "P":
                    this.#createPiece(
                        PieceType.PAWN,
                        PieceColour.WHITE,
                        new Square(row, col)
                    );
                    col++;
                    break;
                case "N":
                    this.#createPiece(
                        PieceType.KNIGHT,
                        PieceColour.WHITE,
                        new Square(row, col)
                    );
                    col++;
                    break;
                case "B":
                    this.#createPiece(
                        PieceType.BISHOP,
                        PieceColour.WHITE,
                        new Square(row, col)
                    );
                    col++;
                    break;
                case "R":
                    this.#createPiece(
                        PieceType.ROOK,
                        PieceColour.WHITE,
                        new Square(row, col)
                    );
                    col++;
                    break;
                case "Q":
                    this.#createPiece(
                        PieceType.QUEEN,
                        PieceColour.WHITE,
                        new Square(row, col)
                    );
                    col++;
                    break;
                case "K":
                    this.#createPiece(
                        PieceType.KING,
                        PieceColour.WHITE,
                        new Square(row, col)
                    );
                    col++;
                    break;
                case "/":
                    row--;
                    col = 0;
                    break;
                case "1":
                case "2":
                case "3":
                case "4":
                case "5":
                case "6":
                case "7":
                case "8":
                    col += parseInt(ch);
                    //row += Math.floor((col + parseInt(ch)) / 8);
                    break;
            }
        }

        this.currentTurn = PieceColour.WHITE;
        if (components[1] === "b") {
            this.currentTurn = PieceColour.BLACK;
        }

        this.whiteKingsideRights = false;
        this.whiteQueensideRights = false;
        this.blackKingsideRights = false;
        this.blackQueensideRights = false;
        for (let ch of components[2]) {
            if (ch === "K") {
                this.whiteKingsideRights = true;
            } else if (ch === "Q") {
                this.whiteQueensideRights = true;
            } else if (ch === "k") {
                this.blackKingsideRights = true;
            } else if (ch === "q") {
                this.blackQueensideRights = true;
            }
        }

        if (components[3] === "-") {
            this.enPassantSquare = null;
        } else {
            const col = components[3].charCodeAt(0) - 97;
            const row = components[3][1] - 1;
            this.enPassantSquare = new Square(row, col);
        }

        /*
        // half-move clock (reset every pawn move)
        this.halfMoveClock = parseInt(components[4]);

        // full-move counter (doesn't reset)
        this.gamePly = parseInt(components[5]) * 2;
        if(this.currentTurn === PieceColour.BLACK) {
            this.gamePly--;
        }
        */
    }
}

export default Position;
