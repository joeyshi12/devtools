import * as d3Dsv from 'd3-dsv';
import { PQLStatement, RowData } from 'pql-parser';

let data: RowData[] = [];
const queryInputElement = <HTMLInputElement>document.getElementById("query-input")
const saveButtonElement = <HTMLButtonElement>document.getElementById("save-button");
const plotContainerElement = document.getElementById("plot-container");
const filePreviewElement = document.getElementById("file-preview");

function renderPlot(query: string) {
    if (data.length === 0) {
        alert("No input file provided");
        return;
    }
    try {
        const statement = PQLStatement.create(query);
        const svg = statement.execute(data, {
            containerWidth: 700,
            containerHeight: 500,
            margin: { top: 60, right: 40, bottom: 40, left: 120 }
        });
        const plotElement = document.createElement("div");
        plotElement.className = "card";
        plotElement.appendChild(svg);
        if (plotContainerElement.childNodes.length > 0) {
            plotContainerElement.replaceChild(plotElement, plotContainerElement.childNodes[0]);
        } else {
            plotContainerElement.appendChild(plotElement);
        }
        if (saveButtonElement.disabled) {
            saveButtonElement.disabled = false;
        }
    } catch (err) {
        alert(err);
    }
}

function renderTablePreview(data: RowData[], pageSize: number) {
    if (data.length === 0) {
        return;
    }

    const tableElement = document.createElement("table");
    const headElement = tableElement.createTHead();
    const headRow = headElement.insertRow();
    const keys: string[] = Array.from(Object.keys(data[0]));
    for (let key of keys) {
        const cellElement = headRow.insertCell();
        cellElement.textContent = key;
    }

    const bodyElement = tableElement.createTBody();
    for (let i = 0; i < Math.min(data.length, pageSize); i++) {
        const rowElement = bodyElement.insertRow();
        for (let key of keys) {
            const cellElement = rowElement.insertCell();
            cellElement.textContent = String(data[i][key]);
        }
    }

    if (filePreviewElement.childNodes.length > 0) {
        filePreviewElement.replaceChild(tableElement, filePreviewElement.childNodes[0]);
    } else {
        filePreviewElement.appendChild(tableElement);
    }
}

document.getElementById("csv-input").addEventListener("change", (event: any) => {
    const file = event.target.files[0];
    if (!file) {
        return;
    }
    const reader = new FileReader();
    reader.addEventListener("load", (event: any) => {
        data = d3Dsv.csvParse(event.target.result);
        renderTablePreview(data, 5);
    });
    reader.readAsText(file,"UTF-8");
});

queryInputElement.addEventListener("keydown", (event: any) => {
    if (event.key === "Enter") {
        renderPlot(event.target.value);
    }
});

document.getElementById("query-button").addEventListener("click", () => {
    renderPlot(queryInputElement.value);
});

saveButtonElement.addEventListener("click", () => {
    const svgElement = document.getElementsByTagName("svg")[0]
    if (!svgElement) {
        return;
    }

    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svgElement);
    var preface = '<?xml version="1.0" standalone="no"?>\r\n';
    var svgBlob = new Blob([preface, source], {type:"image/svg+xml;charset=utf-8"});

    const downloadLink = <HTMLAnchorElement>document.createElement("a");
    downloadLink.href = URL.createObjectURL(svgBlob);
    downloadLink.download = "pql.svg";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
});
