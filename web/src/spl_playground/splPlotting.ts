import { BarPlotCall, PointPlotCall, SPLQuery } from "spl-parser";
import { barChart, lineChart, PlotConfig, scatterPlot } from "./plots";
import { ColumnData, transformData } from "./splTransformation";

export function plotData(data: object[], query: SPLQuery) {
    const columns = transformData(data, query);
    switch (query.plotClause!.plotFunction) {
        case "BAR":
            return _createBarChart(columns, query.plotClause as BarPlotCall);
        case "LINE":
            return _createXYPlot(columns, query.plotClause as PointPlotCall);
        case "SCATTER":
            return _createXYPlot(columns, query.plotClause as PointPlotCall, true);
        default:
            throw new Error(`Invalid plot type ${this.plotCall}`);
    }
}

function _createBarChart(columns: ColumnData[], barPlotCall: BarPlotCall): SVGSVGElement {
    const config = _createPlotConfig(
        barPlotCall.categoriesIdentifier,
        barPlotCall.valuesIdentifier
    );

    const categoriesColumn = columns.find(column => column.name === barPlotCall.categoriesIdentifier);
    const valuesColumn = columns.find(column => column.name === barPlotCall.valuesIdentifier);
    if (!categoriesColumn || !valuesColumn) {
        throw new Error("Missing category or values data");
    }

    let points: [string, number][] = categoriesColumn.data
        .map((category, i): [string, number] => [String(category), Number(valuesColumn.data[i])])
        .filter(([_, value]: [string, number]) => !isNaN(value));
    points.sort((p1, p2) => p2[1] - p1[1]);

    if (this.limitAndOffset) {
        points = points.slice(
            this.limitAndOffset.offset,
            this.limitAndOffset.offset + this.limitAndOffset.limit
        );
    }

    points.reverse();
    return barChart(points, config);
}

function _createXYPlot(columns: ColumnData[],
                       pointPlotCall: PointPlotCall,
                       isScatter: boolean = false): SVGSVGElement {
    const config = _createPlotConfig(
        pointPlotCall.xIdentifier,
        pointPlotCall.yIdentifier
    );

    const xColumn = columns.find(column => column.name === pointPlotCall.xIdentifier);
    const yColumn = columns.find(column => column.name === pointPlotCall.yIdentifier);
    if (!xColumn || !yColumn) {
        throw new Error("Missing x or y column");
    }

    let points: [number, number][] = xColumn.data
        .map((x, i): [number, number] => [Number(x), Number(yColumn.data[i])])
        .filter(([x, y]: [number, number]) => !isNaN(x) && !isNaN(y));
    points.sort((p1, p2) => p1[0] - p2[0]);

    if (this.limitAndOffset) {
        points = points.slice(
            this.limitAndOffset.offset,
            this.limitAndOffset.offset + this.limitAndOffset.limit
        );
    }

    return isScatter ? scatterPlot(points, config) : lineChart(points, config);
}

function _createPlotConfig(xLabel: string, yLabel: string): PlotConfig {
    return {
        containerWidth: 700,
        containerHeight: 500,
        margin: {
            top: 60,
            right: 40,
            bottom: 40,
            left: 120
        },
        xLabel,
        yLabel
    };
}
