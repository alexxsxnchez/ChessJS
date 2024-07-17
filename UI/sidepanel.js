import eventBus from "../Common/eventbus.js";

class SidePanel {
    constructor() {
        const startButton = document.getElementById("startButton");
        startButton.addEventListener("click", () => {
            eventBus.emit("sidepanel::start");
        });
        const undoButton = document.getElementById("undoButton");
        undoButton.addEventListener("click", () => {
            eventBus.emit("sidepanel::undo");
        });
        const highlightMovesCheckbox =
            document.getElementById("highlightCheckbox");
        highlightMovesCheckbox.checked = true;
        highlightMovesCheckbox.addEventListener("click", () => {
            eventBus.emit(
                "sidepanel::highlightChecked",
                highlightMovesCheckbox.checked
            );
        });
    }
}

export default SidePanel;
