import eventBus from "./Common/eventbus.js";
import Canvas from "./UI/canvas.js";
import Game from "./GameManager/game.js";

function main() {
    const canvas = new Canvas();

    let game = null;
    eventBus.on("assets::ready", () => {
        game = new Game();
        const startButton = document.getElementById("startButton");
        startButton.addEventListener("click", () => {
            if (game.paused) {
                game.start();
            }
        });
    });

    eventBus.on("state::initialized", (gameState) => {
        canvas.draw(gameState);
    });

    eventBus.on("game::start", () => {
        console.log("ok game started");
    });
}

main();
