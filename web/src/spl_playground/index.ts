import * as d3Dsv from "d3-dsv";
import { SPLEditorMode } from "./mode_spl";
import "ace-builds/src-min-noconflict/ace";
import "ace-builds/src-min-noconflict/ext-language_tools";
import { Lexer, Parser } from "spl-parser";
import { plotData } from "./splPlotting";

const editor = ace.edit("query-input");
editor.session.setMode(<any>new SPLEditorMode());
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

let data: any[] = [];

const csvInputElement = <HTMLInputElement>document.getElementById("csv-input");
const plotButtonElement = <HTMLButtonElement>document.getElementById("plot-button");
const saveButtonElement = <HTMLButtonElement>document.getElementById("save-button");
const tablePreviewElement = <HTMLDivElement>document.getElementById("table-preview");
const plotContainerElement = <HTMLDivElement>document.getElementById("plot-container");

csvInputElement.addEventListener("change", (event: any) => {
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

function renderPlot(queryString: string) {
    if (data.length === 0) {
        alert("No input file provided");
        return;
    }
    try {
        const query = new Parser(new Lexer(queryString)).parse();
        const svg = plotData(data, query);
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

function renderTablePreview(maxLines: number) {
    if (data.length === 0) {
        tablePreviewElement.textContent = "";
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

    if (tablePreviewElement.childNodes.length > 0) {
        tablePreviewElement.replaceChild(tableElement, tablePreviewElement.childNodes[0]);
    } else {
        tablePreviewElement.appendChild(tableElement);
    }
}
