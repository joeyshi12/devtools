const editor = ace.edit("editor");
editor.session.setMode("ace/mode/json");

const formElement = document.getElementById("jdtt-form");
formElement.addEventListener("submit", (event) => {
    document.getElementById("schema-input").value = editor.getValue();
    event.preventDefault();
    formElement.submit();
});

document.getElementById("fullscreen-button").addEventListener("click", () => {
    editor.container.requestFullscreen();
});
