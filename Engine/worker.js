import Search from "./search.js";
import BBPosition from "../GameManager/bbposition.js";

const search = new Search();

onmessage = (e) => {
    const data = e.data;
    if (data.type === "search") {
        const position = new BBPosition(data.fen);
        console.log(position);
        const result = search.iterativeDeepeningSearch(position);
        postMessage(result);
        // } else if (data.type === "cancel") {
        //     console.log("cancel message");
        //     search.cancelled = true;
    }
};
