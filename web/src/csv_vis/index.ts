import * as d3 from 'd3';
import { Lexer, Parser } from 'pql-parser';
import { PlotConfig } from './plotConfig';
import { plotPoints } from './scatterPlot';

let data: any[] = [];

function renderPlot(query: string) {
    if (data.length === 0) {
        alert("No input file provided");
        return;
    }
    const parser = new Parser(new Lexer(query));
    try {
        //const syntaxTree = parser.parse();
        const x = data.map(d => d["baseSalary"]);
        const y = data.map(d => d["baseSalary"]);
        const config: PlotConfig = {
            containerWidth: 500,
            containerHeight: 500,
            margin: { top: 20, right: 20, bottom: 20, left: 20 },
            xLabel: "xStuff",
            yLabel: "yStuff"
        };
        const svg = plotPoints(x, y, config);
        setHeadElement(svg, "plot-container")
    } catch (err) {
        alert(err);
    }
}

function renderSchemaTable(data: any[]) {
    const tableElement = <HTMLTableElement>document.createElement("table");
    setHeadElement(tableElement, "table-schema-container")
}

function setHeadElement(element: HTMLElement | SVGElement, parentId: string) {
    const container = document.getElementById(parentId);
    if (container.childNodes.length > 0) {
        container.replaceChild(element, container.childNodes[0]);
    } else {
        container.appendChild(element);
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
        renderSchemaTable(data);
    });
    reader.readAsText(file,"UTF-8");
});

document.getElementById("query-input").addEventListener("keydown", (event: any) => {
    if (event.key === "Enter") {
        renderPlot(event.target.value);
    }
});

document.getElementById("query-button").addEventListener("click", () => {
    const plotInput = <HTMLInputElement>document.getElementById("query-input")
    renderPlot(plotInput.value);
})
