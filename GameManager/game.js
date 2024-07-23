import eventBus from "../Common/eventbus.js";
import { PieceColour, PieceType } from "./Immutable/Pieces/utils.js";
import {
    Move,
    PromotionMove,
    EnPassantMove,
    CastleMove,
} from "./Immutable/move.js";
import Square from "./Immutable/square.js";
import Position from "./position.js";
import Engine from "../Engine/engine.js";

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
        if (this.engine) {
            this.engine.terminate();
        }
        if (
            gameType === GameType.HUMAN_VS_AI ||
            gameType === GameType.AI_VS_HUMAN ||
            gameType === GameType.AI_VS_AI
        ) {
            this.engine = new Engine(this);
        }

        this.gameType = gameType;
        const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
        this.history = [new Position(fen)];
        eventBus.emit("state::updated");
        eventBus.emit("game::start");

        this.#emitNextPlayerMove();
    }

    getCurrentPosition() {
        return this.history.at(-1);
    }

    makeMove(fromSquare, toSquare, promotionType = null) {
        const beforeMovePosition = this.getCurrentPosition();
        const piece = beforeMovePosition.getPiece(fromSquare);
        const move = this.#createMove(
            fromSquare,
            toSquare,
            piece,
            promotionType
        );
        if (beforeMovePosition.isMoveLegal(move)) {
            const newPosition = new Position(beforeMovePosition, move);
            this.history.push(newPosition);
            eventBus.emit("state::updated");

            const canMove = newPosition.doLegalMovesExist();
            const inCheck = newPosition.isKingInCheck();
            if (canMove) {
                if (inCheck) {
                    eventBus.emit("game::move::check");
                } else if (move instanceof CastleMove) {
                    eventBus.emit("game::move::castle");
                } else if (move instanceof PromotionMove) {
                    eventBus.emit("game::move::promotion");
                } else if (
                    beforeMovePosition.getPiece(move.toSquare) ||
                    move instanceof EnPassantMove
                ) {
                    eventBus.emit("game::move::capture");
                } else {
                    eventBus.emit("game::move::self");
                }
                this.#emitNextPlayerMove();
            } else {
                eventBus.emit("game::end");
                if (inCheck) {
                    eventBus.emit(
                        "game::checkmate",
                        beforeMovePosition.currentTurn
                    );
                } else {
                    eventBus.emit("game::stalemate");
                }
            }
        } else {
            eventBus.emit("game::move::illegal");
        }
    }

    undoMove() {
        // always leave the starting position
        if (this.history.length >= 2) {
            const currentTurn = this.getCurrentPosition().currentTurn;
            this.history.pop();
            if (
                this.gameType === GameType.HUMAN_VS_AI ||
                this.gameType === GameType.AI_VS_HUMAN
            ) {
                this.engine.cancel();
                if (
                    (this.history.length >= 2 &&
                        this.gameType === GameType.HUMAN_VS_AI &&
                        currentTurn === PieceColour.WHITE) ||
                    (this.gameType === GameType.AI_VS_HUMAN &&
                        currentTurn === PieceColour.BLACK)
                ) {
                    this.history.pop();
                }
            }
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

    #emitNextPlayerMove() {
        const currentPosition = this.getCurrentPosition();
        const currentTurn = currentPosition.currentTurn;
        switch (this.gameType) {
            case GameType.HUMAN_VS_HUMAN:
                eventBus.emit("game::humanMove", currentTurn);
                break;
            case GameType.AI_VS_AI:
                eventBus.emit("game::aiMove", currentPosition);
                break;
            case GameType.HUMAN_VS_AI:
                if (currentTurn === PieceColour.WHITE) {
                    eventBus.emit("game::humanMove", currentTurn);
                } else {
                    eventBus.emit("game::aiMove", currentPosition);
                }
                break;
            case GameType.AI_VS_HUMAN:
                if (currentTurn === PieceColour.WHITE) {
                    eventBus.emit("game::aiMove", currentPosition);
                } else {
                    eventBus.emit("game::humanMove", currentTurn);
                }
                break;
        }
    }
}

export { Game, GameType };
