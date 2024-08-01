import eventBus from "../Common/eventbus.js";

const startButton = document.getElementById("startButton");
const undoButton = document.getElementById("undoButton");
const highlightMovesCheckbox = document.getElementById("highlightCheckbox");
const showPVList = document.getElementById("pvCheckbox");
const pvList = document.getElementById("pvline");

startButton.addEventListener("click", () => {
    clearPVList();
    eventBus.emit("sidepanel::start");
});

undoButton.addEventListener("click", () => {
    eventBus.emit("sidepanel::undo");
});

highlightMovesCheckbox.checked = true;
highlightMovesCheckbox.addEventListener("click", () => {
    eventBus.emit(
        "sidepanel::highlightChecked",
        highlightMovesCheckbox.checked
    );
});

showPVList.checked = true;
showPVList.addEventListener("click", () => {
    document.getElementById("pvContainer").style.display = showPVList.checked
        ? "initial"
        : "none";
});

eventBus.on("engine::pv", (pv) => {
    clearPVList();

    for (let move of pv.slice(1)) {
        const listItem = document.createElement("li");
        // listItem.appendChild(document.createTextNode(firstname));
        listItem.appendChild(document.createTextNode(move.toString()));
        pvList.appendChild(listItem);
    }
});

function clearPVList() {
    pvList.innerHTML = "";
}

// export default SidePanel;
