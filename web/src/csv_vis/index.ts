import * as d3 from 'd3';
import { Lexer, Parser } from 'pql-parser';
import { createScatterPlotElement } from './scatterPlot';

let data: any[] = [];

function setTab(tabIndex: number) {
    const tabButtons = document.getElementById("tab-buttons").getElementsByTagName("button");
    const tabElements = document.getElementById("tabs").getElementsByClassName("tab");
    for (let j = 0; j < tabElements.length; j++) {
        const tabButton = <HTMLElement>tabButtons.item(j);
        const tabElement = <HTMLElement>tabElements.item(j);
        if (tabIndex === j) {
            tabButton.setAttribute("class", "active")
            tabElement.setAttribute("class", "tab active");
        } else {
            tabButton.setAttribute("class", "")
            tabElement.setAttribute("class", "tab");
        }
    }
}

function renderPlot(query: string) {
    if (data.length === 0) {
        alert("No input file provided");
        return;
    }
    const parser = new Parser(new Lexer(query));
    try {
        const config = parser.parse();
        const svg = createScatterPlotElement(data, config);
        const container = document.getElementById("plot-container");
        if (container.childNodes.length > 0) {
            container.replaceChild(svg, container.childNodes[0]);
        } else {
            container.appendChild(svg);
        }
        setTab(2);
    } catch (err) {
        alert(err);
    }
}

function renderTable() {
    if (data.length === 0) {
        return;
    }

    const keys = Object.keys(data[0]);
    const container = document.getElementById("table-container");
    const tableElement = document.createElement("table");

    const headerElement = document.createElement("thead");
    for (const key of keys) {
        const columnElement = document.createElement("th")
        columnElement.innerText = key;
        headerElement.appendChild(columnElement);
    }
    tableElement.appendChild(headerElement);

    const bodyElement = document.createElement("tbody");
    for (const row of data) {
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

document.getElementById("csv-input").addEventListener("change", (event: any) => {
    const file = event.target.files[0];
    if (!file) {
        return;
    }
    const reader = new FileReader();
    reader.addEventListener("load", (event: any) => {
        data = d3.csvParse(event.target.result);
        renderTable();
        setTab(1);
    });
    reader.readAsText(file,"UTF-8");
});

document.getElementById("plot-input").addEventListener("keydown", (event: any) => {
    if (event.key === "Enter") {
        renderPlot(event.target.value);
    }
});

document.getElementById("plot-button").addEventListener("click", () => {
    const plotInput = <HTMLInputElement>document.getElementById("plot-input")
    renderPlot(plotInput.value);
})

const tabButtons = document.getElementById("tab-buttons").getElementsByTagName("button");
for (let i = 0; i < tabButtons.length; i++) {
    tabButtons.item(i).addEventListener("click", () => {
        setTab(i);
    });
}
