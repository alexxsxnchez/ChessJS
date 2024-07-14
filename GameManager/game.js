import eventBus from "../Common/eventbus.js";
import { PieceColour, PieceType } from "./Immutable/Pieces/utils.js";
import GameState from "./State/gamestate.js";
import {
    Move,
    PromotionMove,
    EnPassantMove,
    CastleMove,
} from "./Immutable/move.js";
import Square from "./Immutable/square.js";

const GameType = Object.freeze({
    HUMAN_VS_HUMAN: "human_vs_human",
    HUMAN_VS_AI: "human_vs_ai",
    AI_VS_HUMAN: "ai_vs_human",
    AI_VS_AI: "ai_vs_ai",
});

class Game {
    constructor() {
        this.started = false;
        this.gameState = new GameState();
    }

    start(gameType = GameType.HUMAN_VS_HUMAN) {
        this.gameType = gameType;
        this.started = true;
        eventBus.emit("game::start");

        this.#emitNextPlayerMove();
    }

    restart(gameType = GameType.HUMAN_VS_HUMAN) {
        this.started = false;
        this.gameState = new GameState();
        eventBus.emit("state::updated");
        this.start(gameType);
    }

    makeMove(fromSquare, toSquare) {
        const piece = this.gameState.getCurrentPosition().getPiece(fromSquare);
        const move = this.#createMove(fromSquare, toSquare, piece);
        const successful = this.gameState.makeMove(move);
        if (successful) {
            eventBus.emit("state::updated");
            this.gameState.checkGameStatus();
            this.#emitNextPlayerMove();
        } else {
            eventBus.emit("game::unsuccessfulMove");
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
            toSquare.equals(this.gameState.getCurrentPosition().enPassantSquare)
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
        const currentTurn = this.gameState
            .getCurrentPosition()
            .getCurrentTurn();
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
