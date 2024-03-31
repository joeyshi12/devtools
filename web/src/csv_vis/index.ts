import * as d3 from 'd3';
import { Lexer, Parser, PQLSyntaxTree, UsingAttribute } from 'pql-parser';
import { plotBars, plotLines, plotPoints, PlotConfig  } from './plots';
import { processData } from './dataProcessing';

let data: any[] = [];

function renderPlot(query: string) {
    if (data.length === 0) {
        alert("No input file provided");
        return;
    }
    const parser = new Parser(new Lexer(query));
    try {
        const syntaxTree = parser.parse();
        const svg = createPlotElement(syntaxTree);
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

function createPlotElement(syntaxTree: PQLSyntaxTree): SVGElement {
    const config: PlotConfig = {
        containerWidth: 700,
        containerHeight: 500,
        margin: { top: 20, right: 20, bottom: 50, left: 120 },
        xLabel: getAttributeName(syntaxTree.usingAttributes[0]),
        yLabel: getAttributeName(syntaxTree.usingAttributes[1])
    };
    const points = processData(data, syntaxTree);
    if (points.length === 0) {
        throw new Error(
            `Failed to process data points for ${syntaxTree.plotType} plot\n` +
                "BAR(x: number, y: string), LINE(x: number, y: number), SCATTER(x: number, y: number)"
        );
    }
    console.log(points);
    switch (syntaxTree.plotType) {
        case "BAR":
            return plotBars(points, config);
        case "LINE":
            return plotLines(points, config);
        case "SCATTER":
            return plotPoints(points, config);
        default:
            throw new Error(`Invalid plot type ${syntaxTree.plotType}`)
    }
}

function getAttributeName(attribute: UsingAttribute): string {
    if (attribute.displayName) {
        return attribute.displayName;
    } else if (attribute.aggregationFunction) {
        return `${attribute.aggregationFunction}(${attribute.column ?? ""})`;
    } else {
        return attribute.column;
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
