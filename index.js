import eventBus from "./Common/eventbus.js";
import { Game } from "./GameManager/game.js";
import SidePanel from "./UI/sidepanel.js";
import AssetLoader from "./UI/assetLoader.js";
import Chessboard from "./UI/chessboard.js";
import SoundManager from "./UI/soundManager.js";

function main() {
    const assetLoader = new AssetLoader(); // load assets

    const sidepanel = new SidePanel();

    let chessboard;
    let soundManager;
    let game = new Game();
    eventBus.on("assets::ready", () => {
        chessboard = new Chessboard(assetLoader, game);
        soundManager = new SoundManager(assetLoader);
        game.start();
    });

    eventBus.on("sidepanel::start", () => {
        if (game) {
            game.start();
        }
    });

    eventBus.on("sidepanel::undo", () => {
        if (game) {
            game.undoMove();
        }
    });

    eventBus.on("game::start", (game) => {
        console.log("ok game started");
    });
}

main();
