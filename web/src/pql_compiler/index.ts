import * as d3Dsv from "d3-dsv";
import { PqlEditorMode } from "./mode_pql";
import "ace-builds/src-min-noconflict/ace";
import "ace-builds/src-min-noconflict/ext-language_tools";
import { PQLStatement } from "./pqlStatement";

type CSVFile = {
    name: string;
    data: d3Dsv.DSVRowArray;
};

const editor = ace.edit("query-input");
editor.session.setMode(<any>new PqlEditorMode());
editor.setOptions({
    enableBasicAutocompletion: true,
    enableSnippets: true,
    enableLiveAutocompletion: true,
});
editor.commands.addCommand({
    name: "executeQuery",
    bindKey: {win: "Ctrl-Enter", mac: "Ctrl-Enter"},
    exec: () => {
        renderPlot(editor.getValue());
    }
});

let csvFile: CSVFile = undefined;
const csvInputElement = <HTMLInputElement>document.querySelector("#csv-input");
const plotButtonElement = <HTMLButtonElement>document.querySelector("#plot-button");
const saveButtonElement = <HTMLButtonElement>document.querySelector("#save-button");
const tablePreviewElement = <HTMLDivElement>document.querySelector("#table-preview-container");
const plotContainerElement = <HTMLDivElement>document.querySelector("#plot-container");

csvInputElement.addEventListener("change", (event: any) => {
    const file = event.target.files[0];
    if (!file) {
        return;
    }
    const reader = new FileReader();
    reader.addEventListener("load", (loadEvent: ProgressEvent<FileReader>) => {
        csvFile = {
            name: file.name,
            data: d3Dsv.csvParse(loadEvent.target.result as string)
        };
        if (csvFile.data.length === 0) {
            alert(`No rows found in ${file.name}`);
        }
        renderTablePreview(5);
    });
    reader.readAsText(file,"UTF-8");
});

plotButtonElement.addEventListener("click", () => {
    renderPlot(editor.getValue());
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

function renderPlot(query: string) {
    if (csvFile?.data.length === 0) {
        alert("No input file provided");
        return;
    }
    try {
        const svg = PQLStatement.create(query).execute(csvFile.data);
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
        console.error(err);
        alert(err);
    }
}

function renderTablePreview(maxLines: number) {
    if (csvFile.data.length === 0) {
        tablePreviewElement.textContent = "";
        return;
    }

    const titleElement = document.createElement("h4");
    titleElement.innerText = "CSV Preview";

    const tableContainer = document.createElement("div");
    tableContainer.className = "table-preview";
    const tableElement = document.createElement("table");
    const headElement = tableElement.createTHead();
    const headRow = headElement.insertRow();
    for (let key of csvFile.data.columns) {
        const cellElement = headRow.insertCell();
        cellElement.textContent = key;
    }

    const bodyElement = tableElement.createTBody();
    for (let i = 0; i < Math.min(csvFile.data.length, maxLines); i++) {
        const rowElement = bodyElement.insertRow();
        for (let key of csvFile.data.columns) {
            const cellElement = rowElement.insertCell();
            cellElement.textContent = String(csvFile.data[i][key]);
        }
    }
    tableContainer.appendChild(tableElement);

    if (tablePreviewElement.childNodes.length > 0) {
        tablePreviewElement.innerHTML = "";
    }
    tablePreviewElement.appendChild(titleElement);
    tablePreviewElement.appendChild(tableContainer);
}
