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
                position: position,
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
                    new Square(
                        moveObject.fromSquare.row,
                        moveObject.fromSquare.col
                    ),
                    new Square(
                        moveObject.toSquare.row,
                        moveObject.toSquare.col
                    ),
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
