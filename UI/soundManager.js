import eventBus from "../Common/eventbus.js";

class SoundManager {
    constructor(assetLoader) {
        this.assetLoader = assetLoader;
        this.#setupListeners();
    }

    #playSound(name) {
        this.assetLoader.getSound(name).play();
    }

    #setupListeners() {
        eventBus.on("game::move::self", () => {
            this.#playSound("move-self");
        });
        eventBus.on("game::move::check", () => {
            this.#playSound("check");
        });
        eventBus.on("game::move::castle", () => {
            this.#playSound("castle");
        });
        eventBus.on("game::move::promotion", () => {
            this.#playSound("promotion");
        });
        eventBus.on("game::move::capture", () => {
            this.#playSound("capture");
        });
        eventBus.on("game::move::illegal", () => {
            this.#playSound("illegal");
        });
        eventBus.on("game::start", () => {
            this.#playSound("game-start");
        });
        eventBus.on("game::end", () => {
            this.#playSound("game-end");
        });
    }
}

export default SoundManager;
