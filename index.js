import eventBus from "./Common/eventbus.js";
import { Game } from "./GameManager/game.js";
import SidePanel from "./UI/sidepanel.js";
import AssetLoader from "./UI/assetLoader.js";
import Chessboard from "./UI/chessboard.js";

function main() {
    const assetLoader = new AssetLoader(); // load assets

    const sidepanel = new SidePanel();

    let chessboard = null;
    let game = null;
    eventBus.on("assets::ready", () => {
        game = new Game();
        chessboard = new Chessboard(assetLoader, game);
        game.start();
    });

    eventBus.on("sidepanel::start", () => {
        if (game) {
            game.restart();
        }
    });

    eventBus.on("game::start", (game) => {
        console.log("ok game started");
    });
}

main();
