import eventBus from "../Common/eventbus.js";
import Square from "../GameManager/Immutable/square.js";

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
            });
        });

        this.worker.onmessage = (e) => {
            if (this.cancelled) {
                console.log("cancelled. not processing");
                return;
            }
            const moveObject = e.data;
            if (moveObject) {
                this.game.makeMove(
                    moveObject.fromSquare,
                    moveObject.toSquare,
                    moveObject.promotionType
                );
            }
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
