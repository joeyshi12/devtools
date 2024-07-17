import "ace-builds/src-min-noconflict/ace";
import "ace-builds/src-min-noconflict/mode-json";

const editor = ace.edit("editor");
editor.session.setMode("ace/mode/json");

const formElement = <HTMLFormElement>document.getElementById("jdtt-form");
const jsonInput = <HTMLInputElement>document.getElementById("json-input");

formElement.addEventListener("submit", (event) => {
    event.preventDefault();
    let jsonInputString: string;
    try {
        jsonInputString = JSON.stringify(JSON.parse(editor.getValue()));
    } catch (e) {
        alert("Invalid JSON object entered");
        return;
    }
    jsonInput.value = jsonInputString;
    formElement.submit();
});

document.getElementById("fullscreen-button").addEventListener("click", () => {
    editor.container.requestFullscreen();
});
