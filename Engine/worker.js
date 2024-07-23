import Search from "./search.js";
import Position from "../GameManager/position.js";

const search = new Search();

onmessage = (e) => {
    const data = e.data;
    if (data.type === "search") {
        const position = new Position(data.position);
        console.log(position);
        const result = search.iterativeDeepeningSearch(position);
        postMessage(result);
        // } else if (data.type === "cancel") {
        //     console.log("cancel message");
        //     search.cancelled = true;
    }
};
