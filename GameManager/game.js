import eventBus from "../Common/eventbus.js";
import { PieceColour, PieceType } from "./Immutable/Pieces/utils.js";
import {
    Move,
    PromotionMove,
    EnPassantMove,
    CastleMove,
} from "./Immutable/move.js";
import Square from "./Immutable/square.js";
import { Position } from "./position.js";

const GameType = Object.freeze({
    HUMAN_VS_HUMAN: "human_vs_human",
    HUMAN_VS_AI: "human_vs_ai",
    AI_VS_HUMAN: "ai_vs_human",
    AI_VS_AI: "ai_vs_ai",
});

class Game {
    constructor() {
        this.history = [];
    }

    start(gameType = GameType.HUMAN_VS_HUMAN) {
        this.gameType = gameType;
        this.history = [new Position()];
        eventBus.emit("state::updated");
        eventBus.emit("game::start");

        this.#emitNextPlayerMove();
    }

    getCurrentPosition() {
        return this.history.at(-1);
    }

    makeMove(fromSquare, toSquare, promotionType = null) {
        const currentPosition = this.getCurrentPosition();
        const piece = currentPosition.getPiece(fromSquare);
        const move = this.#createMove(
            fromSquare,
            toSquare,
            piece,
            promotionType
        );
        if (currentPosition.isMoveLegal(move)) {
            const newPosition = new Position(currentPosition, move);
            this.history.push(newPosition);
            eventBus.emit("state::updated");
            const gameOver = this.#checkGameStatus();
            if (!gameOver) {
                this.#emitNextPlayerMove();
            }
        } else {
            eventBus.emit("game::unsuccessfulMove");
        }
    }

    undoMove() {
        // always leave the starting position
        if (this.history.length >= 2) {
            this.history.pop();
            eventBus.emit("state::updated");
            this.#emitNextPlayerMove();
        }
    }

    #createMove(fromSquare, toSquare, piece, promotionType = null) {
        if (promotionType) {
            return new PromotionMove(
                fromSquare,
                toSquare,
                piece,
                promotionType
            );
        }
        if (
            piece.type === PieceType.KING &&
            Math.abs(fromSquare.col - toSquare.col) === 2
        ) {
            const originalRookCol = toSquare.col > fromSquare.col ? 7 : 0;
            return new CastleMove(
                fromSquare,
                toSquare,
                piece,
                new Square(fromSquare.row, originalRookCol)
            );
        }
        if (
            piece.type === PieceType.PAWN &&
            toSquare.equals(this.getCurrentPosition().enPassantSquare)
        ) {
            return new EnPassantMove(
                fromSquare,
                toSquare,
                piece,
                new Square(fromSquare.row, toSquare.col)
            );
        }
        return new Move(fromSquare, toSquare, piece);
    }

    #checkGameStatus() {
        const currentPosition = this.getCurrentPosition();
        const canMove = currentPosition.doLegalMovesExist();
        const inCheck = currentPosition.isKingInCheck();
        if (canMove) {
            if (inCheck) {
                eventBus.emit("game::check");
            }
            return false;
        } else {
            if (inCheck) {
                eventBus.emit(
                    "game::checkmate",
                    PieceColour.getOpposite(currentPosition.getCurrentTurn())
                );
            } else {
                eventBus.emit("game::stalemate");
            }
            return true;
        }
    }

    #emitNextPlayerMove() {
        const currentTurn = this.getCurrentPosition().getCurrentTurn();
        switch (this.gameType) {
            case GameType.HUMAN_VS_HUMAN:
                eventBus.emit("game::humanMove", currentTurn);
                break;
            case GameType.AI_VS_AI:
                eventBus.emit("game::aiMove");
                break;
            case GameType.HUMAN_VS_AI:
                if (currentTurn === PieceColour.WHITE) {
                    eventBus.emit("game::humanMove", currentTurn);
                } else {
                    eventBus.emit("game::aiMove");
                }
                break;
            case GameType.AI_VS_HUMAN:
                if (currentTurn === PieceColour.WHITE) {
                    eventBus.emit("game::aiMove");
                } else {
                    eventBus.emit("game::humanMove", currentTurn);
                }
                break;
        }
    }
}

export { Game, GameType };
