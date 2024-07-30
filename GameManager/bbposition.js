import { PieceColour, PieceType } from "./Immutable/Pieces/utils.js";
import Bitboard from "./bitboard.js";
import { MoveType } from "./Immutable/bbMove.js";
import { sqIsAttacked } from "./bbmovegen.js";
import zobrist from "../Engine/zobrist.js";

const STARTING_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

class Piece {
    constructor(type, colour) {
        this.type = type;
        this.colour = colour;
    }
}

// IrreversableState -> info that cannot be determined from undoing a move along
class IrreversableState {
    constructor({
        hash,
        whiteKingsideRights,
        whiteQueensideRights,
        blackKingsideRights,
        blackQueensideRights,
        enPassantSquare,
        rule50,
        movedPiece,
        capturedPiece,
    }) {
        this.hash = hash;
        this.whiteKingsideRights = whiteKingsideRights;
        this.whiteQueensideRights = whiteQueensideRights;
        this.blackKingsideRights = blackKingsideRights;
        this.blackQueensideRights = blackQueensideRights;
        this.enPassantSquare = enPassantSquare;
        this.rule50 = rule50;
        this.movedPiece = movedPiece;
        this.capturedPiece = capturedPiece;
    }
}

class BBPosition {
    constructor(fen = STARTING_FEN) {
        this.pieces = Array.from({ length: 2 }, () =>
            Array.from({ length: 6 }, () => new Bitboard())
        );
        this.sides = [new Bitboard(), new Bitboard()];
        this.squares = new Array(64).fill(null);
        this.prevStates = [];
        this.#createFromFEN(fen);
    }

    #createFromFEN(fen) {
        const components = fen.split(" ");
        const pieces = components[0];
        for (let i = 0, sq = 56; i < pieces.length; i++, sq++) {
            const ch = pieces[i];
            switch (ch) {
                case "p":
                    this.#putPiece(PieceType.PAWN, PieceColour.BLACK, sq);
                    break;
                case "n":
                    this.#putPiece(PieceType.KNIGHT, PieceColour.BLACK, sq);
                    break;
                case "b":
                    this.#putPiece(PieceType.BISHOP, PieceColour.BLACK, sq);
                    break;
                case "r":
                    this.#putPiece(PieceType.ROOK, PieceColour.BLACK, sq);
                    break;
                case "q":
                    this.#putPiece(PieceType.QUEEN, PieceColour.BLACK, sq);
                    break;
                case "k":
                    this.#putPiece(PieceType.KING, PieceColour.BLACK, sq);
                    break;
                case "P":
                    this.#putPiece(PieceType.PAWN, PieceColour.WHITE, sq);
                    break;
                case "N":
                    this.#putPiece(PieceType.KNIGHT, PieceColour.WHITE, sq);
                    break;
                case "B":
                    this.#putPiece(PieceType.BISHOP, PieceColour.WHITE, sq);
                    break;
                case "R":
                    this.#putPiece(PieceType.ROOK, PieceColour.WHITE, sq);
                    break;
                case "Q":
                    this.#putPiece(PieceType.QUEEN, PieceColour.WHITE, sq);
                    break;
                case "K":
                    this.#putPiece(PieceType.KING, PieceColour.WHITE, sq);
                    break;
                case "/":
                    sq -= 16;
                    sq--;
                    break;
                case "1":
                case "2":
                case "3":
                case "4":
                case "5":
                case "6":
                case "7":
                case "8":
                    sq += parseInt(ch);
                    sq--;
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
            const sq = row * 8 + col;
            this.enPassantSquare = sq;
        }

        // half-move clock (reset every pawn move)
        this.rule50 = parseInt(components[4]);

        // full-move counter (doesn't reset)
        // TODO: check this logic
        this.ply = parseInt(components[5]) * 2;
        if (this.currentTurn === PieceColour.BLACK) {
            this.ply--;
        }

        this.hash = zobrist.computeHash(this);
    }

    generateFEN() {
        let fen = "";
        let noPieceCounter = 0;
        for (let sq = 56; sq >= 0; sq++) {
            const piece = this.squares[sq];
            if (piece) {
                if (noPieceCounter) {
                    fen += noPieceCounter;
                    noPieceCounter = 0;
                }
                let pieceChar;
                switch (piece.type) {
                    case PieceType.PAWN:
                        pieceChar = "p";
                        break;
                    case PieceType.KNIGHT:
                        pieceChar = "n";
                        break;
                    case PieceType.BISHOP:
                        pieceChar = "b";
                        break;
                    case PieceType.ROOK:
                        pieceChar = "r";
                        break;
                    case PieceType.QUEEN:
                        pieceChar = "q";
                        break;
                    case PieceType.KING:
                        pieceChar = "k";
                        break;
                }
                if (piece.colour === PieceColour.WHITE) {
                    pieceChar = pieceChar.toUpperCase();
                }
                fen += pieceChar;
            } else {
                noPieceCounter++;
            }
            if (sq % 8 === 7) {
                sq -= 16;
                if (noPieceCounter) {
                    fen += noPieceCounter;
                    noPieceCounter = 0;
                }
                fen += "/";
            }
        }
        fen = fen.slice(0, -1);
        if (this.currentTurn === PieceColour.WHITE) {
            fen += " w ";
        } else {
            fen += " b ";
        }
        if (this.whiteKingsideRights) {
            fen += "K";
        }
        if (this.whiteQueensideRights) {
            fen += "Q";
        }
        if (this.blackKingsideRights) {
            fen += "k";
        }
        if (this.blackQueensideRights) {
            fen += "q";
        }
        if (fen.charAt(-1) === " ") {
            fen += "-";
        }
        if (this.enPassantSquare !== null) {
            const row = Math.floor(this.enPassantSquare / 8) + 1;
            const col = this.enPassantSquare % 8;
            fen += " " + String.fromCharCode(97 + col) + row;
        } else {
            fen += " -";
        }
        fen += " " + this.rule50;
        fen += " " + Math.floor(this.ply / 2);
        return fen;
    }

    makeMove(move) {
        const fromSquare = move.fromSquare;
        const toSquare = move.toSquare;
        const movedPiece = this.squares[fromSquare];

        let capturedPiece = this.squares[toSquare];
        if (move.moveType === MoveType.CAPTURE_EP) {
            const delta = movedPiece.colour === PieceColour.WHITE ? 8 : -8;
            capturedPiece = this.squares[toSquare - delta];
        }

        this.prevStates.push(
            new IrreversableState({
                hash: this.hash.copy(),
                whiteKingsideRights: this.whiteKingsideRights,
                whiteQueensideRights: this.whiteQueensideRights,
                blackKingsideRights: this.blackKingsideRights,
                blackQueensideRights: this.blackQueensideRights,
                enPassantSquare: this.enPassantSquare,
                rule50: this.rule50,
                movedPiece: movedPiece,
                capturedPiece: capturedPiece,
            })
        );

        this.ply++;
        this.rule50++;
        if (this.enPassantSquare !== null) {
            this.hash.toggle(zobrist.enPassantFiles[this.enPassantSquare % 8]);
            this.enPassantSquare = null;
        }

        this.#zobristClearPiece(fromSquare);
        this.hash.toggle(zobrist.pieceTable[fromSquare]);

        switch (move.moveType) {
            case MoveType.QUIET:
                this.#zobristPutPiece(
                    movedPiece.type,
                    movedPiece.colour,
                    toSquare
                );
                break;

            case MoveType.CAPTURE:
                this.#zobristClearPiece(toSquare);
                this.#zobristPutPiece(
                    movedPiece.type,
                    movedPiece.colour,
                    toSquare
                );
                this.rule50 = 0;
                break;

            case MoveType.CAPTURE_EP:
                const delta = movedPiece.colour === PieceColour.WHITE ? 8 : -8;
                const capturedSquare = toSquare - delta;
                this.#zobristClearPiece(capturedSquare);
                this.#zobristPutPiece(
                    PieceType.PAWN,
                    movedPiece.colour,
                    toSquare
                );
                this.rule50 = 0;
                break;

            case MoveType.CASTLE:
                this.#zobristPutPiece(
                    PieceType.KING,
                    movedPiece.colour,
                    toSquare
                );
                const [rookFromSquare, rookToSquare] =
                    this.#getCastleRookSquares(toSquare);
                this.#zobristClearPiece(rookFromSquare);
                this.#zobristPutPiece(
                    PieceType.ROOK,
                    movedPiece.colour,
                    rookToSquare
                );
                break;

            case MoveType.PROMOTION:
                this.#zobristPutPiece(
                    move.promotionType,
                    movedPiece.colour,
                    toSquare
                );
                break;

            case MoveType.PROMOTION_CAPTURE:
                this.#zobristClearPiece(toSquare);
                this.#zobristPutPiece(
                    move.promotionType,
                    movedPiece.colour,
                    toSquare
                );
                break;
        }

        if (movedPiece.type === PieceType.PAWN) {
            this.rule50 = 0;

            // check for enpassant square
            if (Math.abs(fromSquare - toSquare) === 16) {
                // double push pawn
                const delta = movedPiece.colour === PieceColour.WHITE ? 8 : -8;
                this.enPassantSquare = toSquare - delta;
                this.hash.toggle(
                    zobrist.enPassantFiles[this.enPassantSquare % 8]
                );
            }
        }

        // update castling rights
        if (fromSquare === 4) {
            // move white king
            this.whiteKingsideRights = false;
            this.whiteQueensideRights = false;
        } else if (fromSquare === 60) {
            // move black king
            this.blackKingsideRights = false;
            this.blackQueensideRights = false;
        }
        if (fromSquare === 0 || toSquare === 0) {
            // white queenside rook
            this.whiteQueensideRights = false;
        } else if (fromSquare === 7 || toSquare === 7) {
            // white kingside rook
            this.whiteKingsideRights = false;
        } else if (fromSquare === 56 || toSquare === 56) {
            // black queenside rook
            this.blackQueensideRights = false;
        } else if (fromSquare === 63 || toSquare === 63) {
            // black kingside rook
            this.blackKingsideRights = false;
        }

        this.#zobristUpdateCastling();

        const isValidMove = !this.isKingInCheck(this.currentTurn);
        this.currentTurn = PieceColour.getOpposite(this.currentTurn);

        this.hash.toggle(zobrist.blackToMove);

        return isValidMove;
    }

    // assumes past in move is the most recent move applied
    undoMove(move) {
        const state = this.prevStates.pop();
        this.hash = state.hash;
        this.whiteKingsideRights = state.whiteKingsideRights;
        this.whiteQueensideRights = state.whiteQueensideRights;
        this.blackKingsideRights = state.blackKingsideRights;
        this.blackQueensideRights = state.blackQueensideRights;
        this.enPassantSquare = state.enPassantSquare;
        this.rule50 = state.rule50;

        this.ply--;
        this.currentTurn = PieceColour.getOpposite(this.currentTurn);

        const fromSquare = move.fromSquare;
        const toSquare = move.toSquare;

        this.#putPiece(
            state.movedPiece.type,
            state.movedPiece.colour,
            fromSquare
        );
        this.#clearPiece(toSquare);

        switch (move.moveType) {
            case MoveType.QUIET:
            case MoveType.PROMOTION:
                break;

            case MoveType.CAPTURE:
            case MoveType.PROMOTION_CAPTURE:
                this.#putPiece(
                    state.capturedPiece.type,
                    state.capturedPiece.colour,
                    toSquare
                );
                break;

            case MoveType.CAPTURE_EP:
                const delta =
                    state.movedPiece.colour === PieceColour.WHITE ? 8 : -8;
                const capturedSquare = toSquare - delta;
                this.#putPiece(
                    PieceType.PAWN,
                    state.capturedPiece.colour,
                    capturedSquare
                );
                break;

            case MoveType.CASTLE:
                const [rookFromSquare, rookToSquare] =
                    this.#getCastleRookSquares(toSquare);
                this.#clearPiece(rookToSquare);
                this.#putPiece(
                    PieceType.ROOK,
                    state.movedPiece.colour,
                    rookFromSquare
                );
                break;
        }
    }

    isKingInCheck(kingColour = this.currentTurn) {
        const kingSquare =
            this.pieces[kingColour][PieceType.KING].getLowestBitPosition();
        const opponent = PieceColour.getOpposite(kingColour);
        return sqIsAttacked(this, kingSquare, opponent);
    }

    getPiece(square) {
        return this.squares[square];
    }

    #putPiece(type, colour, sq) {
        this.pieces[colour][type].setBit(sq);
        this.sides[colour].setBit(sq);
        this.squares[sq] = new Piece(type, colour);
    }

    #clearPiece(sq) {
        const piece = this.squares[sq];
        if (piece) {
            this.pieces[piece.colour][piece.type].clearBit(sq);
            this.sides[piece.colour].clearBit(sq);
            this.squares[sq] = null;
        }
    }

    #zobristPutPiece(type, colour, sq) {
        this.pieces[colour][type].setBit(sq);
        this.sides[colour].setBit(sq);
        this.squares[sq] = new Piece(type, colour);

        this.hash.toggle(
            zobrist.pieceTable[sq][zobrist.getPieceIndex(type, colour)]
        );
    }

    #zobristClearPiece(sq) {
        const piece = this.squares[sq];
        if (piece) {
            this.pieces[piece.colour][piece.type].clearBit(sq);
            this.sides[piece.colour].clearBit(sq);
            this.squares[sq] = null;

            this.hash.toggle(
                zobrist.pieceTable[sq][
                    zobrist.getPieceIndex(piece.type, piece.colour)
                ]
            );
        }
    }

    #getCastleRookSquares(kingToSquare) {
        if (kingToSquare === 2) {
            return [0, 3]; // white queenside
        } else if (kingToSquare === 6) {
            return [7, 5]; // white kingside
        } else if (kingToSquare === 58) {
            return [56, 59]; // black queenside
        } else if (kingToSquare === 62) {
            return [63, 61]; // black kingside
        }
        throw new Error("invalid castling square");
    }

    #zobristUpdateCastling() {
        if (this.prevStates.length) {
            const prevState = this.prevStates.at(-1);
            if (prevState.whiteKingsideRights !== this.whiteKingsideRights) {
                this.hash.toggle(zobrist.whiteKingsideRights);
            }
            if (prevState.whiteQueensideRights !== this.whiteQueensideRights) {
                this.hash.toggle(zobrist.whiteQueensideRights);
            }
            if (prevState.blackKingsideRights !== this.blackKingsideRights) {
                this.hash.toggle(zobrist.blackKingsideRights);
            }
            if (prevState.blackQueensideRights !== this.blackQueensideRights) {
                this.hash.toggle(zobrist.blackQueensideRights);
            }
        }
    }
}

export default BBPosition;
