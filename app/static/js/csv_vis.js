let csvData;

document.getElementById("csv-input").addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) {
        return;
    }
    const reader = new FileReader();
    reader.addEventListener("load", (event) => {
        csvData = d3.csvParse(event.target.result);
        renderCsvTable();
    });
    reader.readAsText(file,"UTF-8");
});

document.getElementById("plot-button").addEventListener("click", (event) => {
    console.log("click");
});

function renderCsvTable() {
    if (csvData.length === 0) {
        return;
    }
    const keys = Object.keys(csvData[0]);
    const container = document.getElementById("csv-table-container");
    const tableElement = document.createElement("table");

    const headerElement = document.createElement("thead");
    for (const key of keys) {
        const columnElement = document.createElement("th")
        columnElement.innerText = key;
        headerElement.appendChild(columnElement);
    }
    tableElement.appendChild(headerElement);

    const bodyElement = document.createElement("tbody");
    for (const row of csvData) {
        const rowElement = document.createElement("tr");
        for (const key of keys) {
            const dataElement = document.createElement("td");
            dataElement.innerText = row[key];
            rowElement.appendChild(dataElement);
        }
        bodyElement.appendChild(rowElement);
    }
    tableElement.appendChild(bodyElement);

    if (container.childNodes.length > 0) {
        container.replaceChild(tableElement, container.childNodes[0]);
    } else {
        container.appendChild(tableElement);
    }
}
