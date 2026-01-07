import "ace-builds/src-min-noconflict/ace";
import "ace-builds/src-min-noconflict/mode-json";

const editor = ace.edit("editor");
editor.session.setMode("ace/mode/json");

const formElement = <HTMLFormElement>document.getElementById("jdtt-form");
const jsonInput = <HTMLInputElement>document.getElementById("json-input");

fetch("/static/json/jdtt_mock.json").then(async (response) => {
    const mock_data = await response.json()
    editor.session.setValue(JSON.stringify(mock_data, null, 4));
});

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
