import * as d3 from "d3";
import { getShape, PlotConfig } from "./plotConfig";
import { zip } from "../array";

export function plotBars(x: number[], y: string[], config: PlotConfig): SVGElement {
    if (x.length !== y.length) {
        throw new Error("Given number of x values is not equal to the number of y values");
    }

    let data = zip(x, y);
    data.sort((d1, d2) => d2[0] - d1[0])
    data = data.slice(0, 20)
    data.reverse();

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

    const xScale = d3.scaleLinear()
        .domain([Math.min(0, d3.min(data, d => d[0])), d3.max(data, d => d[0])])
        .range([0, width]);

    const yScale = d3.scaleBand()
        .domain(data.map(d => d[1]))
        .range([height, 0])
        .paddingInner(0.1)
        .paddingOuter(0);

    const xAxis = d3.axisBottom(xScale)
        .tickSize(-width - 10)
        .tickPadding(10)
        .tickSizeOuter(0);

    const yAxis = d3.axisLeft(yScale)
        .tickFormat(label => {
            if (label.length <= 10) {
                return label;
            } else {
                return label.substring(0, 10) + "…";
            }
        });

    plotArea.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(xAxis);

    plotArea.append("g")
        .call(yAxis);

    plotArea.selectAll("rect")
        .data(data)
        .enter()
        .append("rect")
        .attr("fill", "steelblue")
        .attr("x", 0)
        .attr("y", d => yScale(d[1]))
        .attr("width", d => xScale(d[0]))
        .attr("height", yScale.bandwidth())

    return svg.node();
}

