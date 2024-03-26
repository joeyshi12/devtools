import * as d3 from "d3";
import { getShape, PlotConfig } from "./plotConfig";
import { zip } from "../array";

export function plotLines(x: number[], y: number[], config: PlotConfig): SVGElement {
    if (x.length !== y.length) {
        throw new Error("Given number of x values is not equal to the number of y values");
    }

    const data = zip(x, y);
    data.sort((d1, d2) => d1[0] - d2[0]);

    const [width, height] = getShape(config);
    const svg = d3.create("svg")
        .attr("width", config.containerWidth)
        .attr("height", config.containerHeight);

    if (config.xLabel) {
        svg.append("text")
            .attr("transform", `translate(${config.containerWidth / 2}, ${config.containerHeight - 10})`)
            .text(config.xLabel);
    }

    if (config.yLabel) {
        svg.append("text")
            .attr("transform", `translate(${config.margin.left - 40}, ${config.containerHeight / 2}) rotate(-90)`)
            .text(config.yLabel);
    }

    const plotArea = svg.append("g")
        .attr("transform", `translate(${config.margin.left},${config.margin.top})`);

    const xScale = d3.scaleLinear()
        .domain(d3.extent(data, d => d[0]))
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain(d3.extent(data, d => d[1]))
        .range([height, 0]);

    const line: d3.Line<any> = d3.line()
        .x(d => xScale(d[0]))
        .y(d => yScale(d[1]));

    plotArea.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("d", line);

    plotArea.selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", d => xScale(d[0]))
        .attr("cy", d => yScale(d[1]))
        .attr("r", 5)
        .attr("fill", "steelblue");

    plotArea.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale));

    plotArea.append("g")
        .call(d3.axisLeft(yScale));

    return svg.node();
}
