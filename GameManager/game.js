import eventBus from "../Common/eventbus.js";
import { GameState } from "./state.js";

class Game {
    constructor() {
        this.gameState = new GameState();
        this.paused = true;
    }

    start() {
        this.paused = false;
        eventBus.emit("game::start");
    }
}

export default Game;
