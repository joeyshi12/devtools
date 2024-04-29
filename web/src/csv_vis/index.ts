import * as d3Dsv from 'd3-dsv';
import { PQLStatement, RowData } from 'pql-parser';

let data: RowData[] = [];

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
            margin: { top: 20, right: 20, bottom: 50, left: 120 }
        });
        const container = document.getElementById("plot-container");
        if (container.childNodes.length > 0) {
            container.replaceChild(svg, container.childNodes[0]);
        } else {
            container.appendChild(svg);
        }
    } catch (err) {
        alert(err);
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
