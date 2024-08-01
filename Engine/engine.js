import eventBus from "../Common/eventbus.js";
import { Move } from "../GameLogic/move.js";

class Engine {
    constructor(game) {
        this.game = game;
        this.worker = new Worker("Engine/worker.js", { type: "module" });
        this.cancelled = false;

        eventBus.on("game::aiMove", (position) => {
            this.cancelled = false;
            this.worker.postMessage({
                type: "search",
                fen: position.generateFEN(),
                hashHistory: position.prevStates.map(
                    (prevState) => prevState.hash
                ),
            });
        });

        this.worker.onmessage = (e) => {
            if (this.cancelled) {
                console.log("cancelled. not processing");
                return;
            }
            if (e.data === null || e.data.length === 0) {
                console.error("worker returned bad result");
                return;
            }
            const pvLine = e.data.map(
                (moveObject) =>
                    new Move(
                        moveObject.fromSquare,
                        moveObject.toSquare,
                        moveObject.moveType,
                        moveObject.promotionType
                    )
            );
            eventBus.emit("engine::pv", pvLine);
            this.game.makeMove(
                pvLine[0].fromSquare,
                pvLine[0].toSquare,
                pvLine[0].promotionType
            );
        };
    }

    cancel() {
        this.cancelled = true;
        this.worker.postMessage({
            type: "cancel",
        });
    }

    terminate() {
        this.worker.terminate();
    }
}

export default Engine;
