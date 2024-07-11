import eventBus from "../Common/eventbus.js";

class SidePanel {
    constructor() {
        const startButton = document.getElementById("startButton");
        startButton.addEventListener("click", () => {
            eventBus.emit("sidepanel::start");
        });
    }
}

export default SidePanel;
