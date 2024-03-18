import * as d3 from 'd3';
import { Lexer, Parser } from 'pql-parser';

let csvData: any[];

document.getElementById("csv-input").addEventListener("change", (event: any) => {
    const file = event.target.files[0];
    if (!file) {
        return;
    }
    const reader = new FileReader();
    reader.addEventListener("load", (event: any) => {
        csvData = d3.csvParse(event.target.result);
        renderCsvTable();
    });
    reader.readAsText(file,"UTF-8");
});

document.getElementById("plot-input").addEventListener("keydown", (event: any) => {
    if (event.key === "Enter") {
        renderPlot(event.target.value);
    }
});

document.getElementById("plot-button").addEventListener("click", (event: any) => {
    const plotInput = <HTMLInputElement>document.getElementById("plot-input")
    renderPlot(plotInput.value);
})

function renderPlot(query: string) {
    const parser = new Parser(new Lexer(query));
    try {
        const result = parser.parse();
        console.log(result);
        alert(JSON.stringify(result));
    } catch (err) {
        alert(err);
    }
}

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
