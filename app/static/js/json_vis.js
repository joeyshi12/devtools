document.getElementById("file-input").addEventListener("change", (event) => {
    const files = event.target.files;
    for (const file of files) {
        readFile(file);
    }
});

function readFile(file) {
    const reader = new FileReader();
    reader.addEventListener('load', (event) => {
        const result = event.target.result;
        console.log(result);
    });
    reader.addEventListener('progress', (event) => {
        if (event.loaded && event.total) {
            const percent = (event.loaded / event.total) * 100;
            console.log(`Progress: ${Math.round(percent)}`);
        }
    });
    reader.readAsText(file,'UTF-8');
}

document.getElementById("query-input").addEventListener("change", (event) => {
    console.log(event.target.value);
});
