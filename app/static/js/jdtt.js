const editor = ace.edit("editor");
editor.session.setMode("ace/mode/json");

const formElement = document.getElementById("jdtt-form");
formElement.addEventListener("submit", (event) => {
    event.preventDefault();
    let jsonInput;
    try {
        jsonInput = JSON.stringify(JSON.parse(editor.getValue()));
    } catch (e) {
        alert("Invalid JSON object entered");
        return;
    }
    document.getElementById("json-input").value = jsonInput;
    formElement.submit();
});

document.getElementById("fullscreen-button").addEventListener("click", () => {
    editor.container.requestFullscreen();
});
