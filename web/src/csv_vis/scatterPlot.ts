import * as d3 from "d3";
import { PQLSyntaxTree } from "pql-parser";

export function createScatterPlotElement(data: any[], config: PQLSyntaxTree): SVGElement {
    const svgWidth = 600;
    const svgHeight = 450;
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
    const width = svgWidth - margin.left - margin.right;
    const height = svgHeight - margin.top - margin.bottom;

    const svg = d3.create("svg")
        .attr("width", svgWidth)
        .attr("height", svgHeight);

    // Create plot area within SVG
    const plotArea = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Define scales
    const xScale = d3.scaleLinear()
        .domain([0, Number(d3.max(data, d => d[config.usingAttributes[0].column]))])
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain([0, Number(d3.max(data, d => d[config.usingAttributes[1].column]))])
        .range([height, 0]);

    // Draw circles for scatter plot
    plotArea.selectAll("circle")
        .data(data)
        .enter().append("circle")
        .attr("cx", d => xScale(d[config.usingAttributes[0].column]))
        .attr("cy", d => yScale(d[config.usingAttributes[1].column]))
        .attr("r", 5)
        .attr("fill", "steelblue");

    // Add x-axis
    plotArea.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale));

    // Add y-axis
    plotArea.append("g")
        .call(d3.axisLeft(yScale));

    return svg.node();
}
