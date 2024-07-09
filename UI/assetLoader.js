import eventBus from "../Common/eventbus.js";

class AssetLoader {
    constructor() {
        this.assetCounter = 0;
        this.pieces = {};

        const pieceNames = [
            "pawn",
            "rook",
            "knight",
            "bishop",
            "queen",
            "king",
        ];
        const colours = ["white", "black"];
        pieceNames.forEach((pieceName) => {
            colours.forEach((colour) => {
                const img = new Image();
                img.onload = () => {
                    this.assetCounter++;
                    if (this.assetCounter === 12) {
                        eventBus.emit("assets::ready");
                    }
                };
                img.src = `../assets/${pieceName}-${colour}.svg`;
                this.pieces[`${pieceName}-${colour}`] = img;
            });
        });
    }
}

export default AssetLoader;
