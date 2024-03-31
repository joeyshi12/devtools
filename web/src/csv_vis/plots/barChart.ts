import * as d3 from "d3";
import { getShape, PlotConfig } from "./plotConfig";
import { Point } from "../dataProcessing";

export function plotBars(points: Point[], config: PlotConfig): SVGElement {
    points.sort((p1, p2) => p2.x - p1.x)
    points = points.slice(0, 20)
    points.reverse();

    const [width, height] = getShape(config);
    const svg = d3.create("svg")
        .attr("width", config.containerWidth)
        .attr("height", config.containerHeight);

    if (config.xLabel) {
        svg.append("text")
            .attr("transform", `translate(${config.containerWidth / 2}, ${config.containerHeight - 10})`)
            .text(config.xLabel);
    }

    const plotArea = svg.append("g")
        .attr("transform", `translate(${config.margin.left},${config.margin.top})`);

    const [xMin, xMax] = d3.extent(points, p => p.x);
    const xScale = d3.scaleLinear()
        .domain([Math.min(0, xMin), xMax])
        .range([0, width]);

    const yScale = d3.scaleBand()
        .domain(points.map(p => p.y))
        .range([height, 0])
        .paddingInner(0.1)
        .paddingOuter(0);

    const xAxis = d3.axisBottom(xScale)
        .tickSize(-width - 10)
        .tickPadding(10)
        .tickSizeOuter(0);

    const yAxis = d3.axisLeft(yScale)
        .tickFormat(label => {
            if (label.length <= 16) {
                return label;
            } else {
                return label.substring(0, 16) + "…";
            }
        });

    plotArea.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(xAxis);

    plotArea.append("g")
        .call(yAxis);

    plotArea.selectAll("rect")
        .data(points)
        .enter()
        .append("rect")
        .attr("fill", "steelblue")
        .attr("x", 0)
        .attr("y", p => yScale(p.y))
        .attr("width", p => xScale(p.x))
        .attr("height", yScale.bandwidth())

    return svg.node();
}

