import "ace-builds/src-noconflict/ace";
import "ace-builds/src-noconflict/mode-json";

const editor = ace.edit("editor");
editor.session.setMode("ace/mode/json");

const formElement = <HTMLFormElement>document.getElementById("jdtt-form");
formElement.addEventListener("submit", (event) => {
    event.preventDefault();
    let jsonInputString: string;
    try {
        jsonInputString = JSON.stringify(JSON.parse(editor.getValue()));
    } catch (e) {
        alert("Invalid JSON object entered");
        return;
    }
    const jsonInput = <HTMLInputElement>document.getElementById("json-input");
    jsonInput.value = jsonInputString;
    formElement.submit();
});

document.getElementById("fullscreen-button").addEventListener("click", () => {
    editor.container.requestFullscreen();
});
