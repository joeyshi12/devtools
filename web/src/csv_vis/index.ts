import * as d3Dsv from "d3-dsv";
import { PQLStatement, RowData } from "pql-parser";
import { PqlEditorMode } from "./mode_pql";
import "ace-builds/src-min-noconflict/ace";
import "ace-builds/src-min-noconflict/ext-language_tools";

let data: RowData[] = [];

const editor = ace.edit("query-input");
editor.session.setMode(<any>new PqlEditorMode());
editor.setOptions({
    enableBasicAutocompletion: true,
    enableSnippets: true,
    enableLiveAutocompletion: true,
});

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

        const plotContainerElement = document.getElementById("plot-container");
        if (plotContainerElement.childNodes.length > 0) {
            plotContainerElement.replaceChild(plotElement, plotContainerElement.childNodes[0]);
        } else {
            plotContainerElement.appendChild(plotElement);
        }

        const saveButtonElement = <HTMLButtonElement>document.getElementById("save-button");
        if (saveButtonElement.disabled) {
            saveButtonElement.disabled = false;
        }
    } catch (err) {
        alert(err);
    }
}

function renderTablePreview(maxLines: number) {
    const filePreviewElement = document.getElementById("table-preview");
    if (data.length === 0) {
        filePreviewElement.textContent = "";
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
    for (let i = 0; i < Math.min(data.length, maxLines); i++) {
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

editor.commands.addCommand({
    name: "executeQuery",
    bindKey: {win: "Ctrl-Enter", mac: "Ctrl-Enter"},
    exec: () => {
        renderPlot(editor.getValue());
    }
});

document.getElementById("csv-input").addEventListener("change", (event: any) => {
    const file = event.target.files[0];
    if (!file) {
        return;
    }
    const reader = new FileReader();
    reader.addEventListener("load", (event: any) => {
        data = d3Dsv.csvParse(event.target.result);
        if (data.length === 0) {
            alert(`No rows found in ${file.name}`);
        }
        renderTablePreview(5);
    });
    reader.readAsText(file,"UTF-8");
});

document.getElementById("plot-button").addEventListener("click", () => {
    renderPlot(editor.getValue());
});

document.getElementById("save-button").addEventListener("click", () => {
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
