import eventBus from "../Common/eventbus.js";
import { PieceColour } from "./Pieces/utils.js";
import { GameState } from "./state.js";

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
        this.gameState.makeMove(fromSquare, toSquare);
        this.#emitNextPlayerMove();
    }

    #emitNextPlayerMove() {
        switch (this.gameType) {
            case GameType.HUMAN_VS_HUMAN:
                eventBus.emit("game::humanMove");
                break;
            case GameType.AI_VS_AI:
                eventBus.emit("game::aiMove");
                break;
            case GameType.HUMAN_VS_AI:
                if (this.gameState.currentTurn === PieceColour.WHITE) {
                    eventBus.emit("game::humanMove");
                } else {
                    eventBus.emit("game::aiMove");
                }
                break;
            case GameType.AI_VS_HUMAN:
                if (this.gameState.currentTurn === PieceColour.WHITE) {
                    eventBus.emit("game::aiMove");
                } else {
                    eventBus.emit("game::humanMove");
                }
                break;
        }
    }
}

export { Game, GameType };
