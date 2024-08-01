import eventBus from "./Common/eventbus.js";
import { Game, GameType } from "./GameLogic/game.js";
import SidePanel from "./UI/sidepanel.js";
import AssetLoader from "./UI/assetLoader.js";
import Chessboard from "./UI/chessboard.js";
import SoundManager from "./UI/soundManager.js";
import { runTestSuite } from "./Perft/perft.js";

const PERFT_TESTING = false;

function main() {
    let chessboard;
    let soundManager;
    let game;
    const sidepanel = new SidePanel();
    if (!PERFT_TESTING) {
        const assetLoader = new AssetLoader(); // load assets

        game = new Game();
        eventBus.on("assets::ready", () => {
            chessboard = new Chessboard(assetLoader, game);
            soundManager = new SoundManager(assetLoader);
            game.start(GameType.HUMAN_VS_AI);
        });

        eventBus.on("game::start", (game) => {
            console.log("ok game started");
        });
    }

    eventBus.on("sidepanel::start", () => {
        if (game) {
            game.start(GameType.HUMAN_VS_AI);
        } else if (PERFT_TESTING) {
            runTestSuite();
        }
    });

    eventBus.on("sidepanel::undo", () => {
        if (game) {
            game.undoMove();
        }
    });
}

main();
