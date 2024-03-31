import * as d3 from "d3";
import { getShape, PlotConfig } from "./plotConfig";
import { Point } from "../dataProcessing";

export function plotLines(points: Point[], config: PlotConfig): SVGElement {
    points.sort((p1, p2) => p1.x - p2.x);

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
        .domain(d3.extent(points, p => p.x))
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain(d3.extent(points, p => p.y))
        .range([height, 0]);

    const line: d3.Line<Point> = d3.line<Point>()
        .x(p => xScale(p.x))
        .y(p => yScale(p.y));

    plotArea.append("path")
        .datum(points)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("d", line);

    plotArea.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale));

    plotArea.append("g")
        .call(d3.axisLeft(yScale));

    return svg.node();
}
