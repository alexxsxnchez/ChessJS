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
                        beforeMovePosition.getCurrentTurn()
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
