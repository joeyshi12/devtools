import * as d3Dsv from "d3-dsv";
import { AndCondition, BarPlotCall, ColumnMetadata, EqualCondition, GreaterThanCondition, GreaterThanOrEqualCondition, LessThanCondition, LessThanOrEqualCondition, Lexer, LimitAndOffset, NotEqualCondition, OrCondition, Parser, PointPlotCall, WhereCondition } from "pql-parser";
import { barChart, lineChart, scatterPlot, PlotConfig } from "./plots";

type CellValue = string | number;

export abstract class PQLStatement {
    protected constructor(private readonly _whereCondition?: WhereCondition,
                          private readonly _groupKey?: string,
                          private readonly _limitAndOffset?: LimitAndOffset) {
    }

    public static create(queryString: string): PQLStatement {
        const query = new Parser(new Lexer(queryString)).parse();
        switch (query.plotClause.plotFunction) {
            case "BAR":
                return new BarPlotStatement(
                    query.plotClause as BarPlotCall,
                    query.whereCondition,
                    query.groupKey,
                    query.limitAndOffset
                );
            case "LINE":
            case "SCATTER":
                return new PointPlotStatement(
                    query.plotClause as PointPlotCall,
                    query.whereCondition,
                    query.groupKey,
                    query.limitAndOffset
                );
            default:
                throw new Error(`Invalid plot function ${query.plotClause.plotFunction}`);
        }
    }

    public execute(rowArray: d3Dsv.DSVRowArray): SVGSVGElement {
        for (let metadata of this._columnMetadata) {
            if (metadata.column && !rowArray.columns.includes(metadata.column)) {
                throw new Error(`Column ${metadata.column} missing from data`);
            }
        }
        const filteredRows = this._whereCondition
            ? rowArray.filter(row => _isSatisfied(row, this._whereCondition))
            : rowArray;
        const projectedRows = this._groupKey
            ? this._aggregateRows(filteredRows)
            : this._projectRows(filteredRows);
        return this._plotRows(projectedRows);
    }

    protected abstract get _columnMetadata(): ColumnMetadata[];

    protected abstract _plotRows(rowArray: CellValue[][]): SVGSVGElement;

    protected _sliceRows<T>(rowArray: T[]): T[] {
        return this._limitAndOffset
            ? rowArray.slice(this._limitAndOffset.offset, this._limitAndOffset.offset + this._limitAndOffset.limit)
            : rowArray;
    }

    private _projectRows(rowArray: d3Dsv.DSVRowString[]): CellValue[][] {
        const keys = this._columnMetadata.map(column => column.column);
        return rowArray.map(row => keys.map(key => row[key]));
    }

    private _aggregateRows(rowArray: d3Dsv.DSVRowString[]): CellValue[][] {
        const groups: Map<string, d3Dsv.DSVRowString[]> = new Map();
        for (let row of rowArray) {
            const groupByValue = row[this._groupKey];
            if (groups.has(groupByValue)) {
                groups.get(groupByValue)!.push(row);
            } else {
                groups.set(groupByValue, [row]);
            }
        }
        const groupEntries = Array.from(groups);
        const columns = this._columnMetadata.map(column => _computeAggregatedColumn(groupEntries, column, this._groupKey!));
        const aggregatedRows = [];
        for (let i = 0; i < columns[0].length; i++) {
            aggregatedRows.push(columns.map(column => column[i]));
        }
        return aggregatedRows;
    }
}

class BarPlotStatement extends PQLStatement {
    private readonly _plotConfig: PlotConfig;

    constructor(private readonly _plotClause: BarPlotCall,
                whereCondition?: WhereCondition,
                groupKey?: string,
                limitAndOffset?: LimitAndOffset) {
        super(whereCondition, groupKey, limitAndOffset);
        this._plotConfig = {
            containerWidth: 700,
            containerHeight: 500,
            margin: {
                top: 60,
                right: 60,
                bottom: 40,
                left: 100
            },
            xLabel: _plotClause.categoriesColumn.identifier,
            yLabel: _plotClause.valuesColumn.identifier
        };
    }

    protected override _plotRows(rowArray: CellValue[][]): SVGSVGElement {
        let points: [string, number][] = [];
        for (let row of rowArray) {
            const value = Number(row[1]);
            if (!isNaN(value)) {
                points.push([String(row[0]), value]);
            }
        }
        this._validatePoints(points);
        points = this._sliceRows(points.sort((p1, p2) => p2[1] - p1[1])).reverse();
        return barChart(points, this._plotConfig);
    }

    protected override get _columnMetadata(): ColumnMetadata[] {
        return [
            this._plotClause.categoriesColumn,
            this._plotClause.valuesColumn
        ];
    }

    private _validatePoints(points: [string, number][]): void {
        const visitedCategories = new Set();
        for (let [category, _] of points) {
            if (visitedCategories.has(category)) {
                throw new Error(`Invalid categories column - duplicate value ${category}`);
            }
            visitedCategories.add(category);
        }
    }
}

class PointPlotStatement extends PQLStatement {
    private readonly _plotConfig: PlotConfig;

    constructor(private readonly _plotClause: PointPlotCall,
                whereCondition?: WhereCondition,
                groupKey?: string,
                limitAndOffset?: LimitAndOffset) {
        super(whereCondition, groupKey, limitAndOffset);
        this._plotConfig = {
            containerWidth: 700,
            containerHeight: 500,
            margin: {
                top: 40,
                right: 40,
                bottom: 60,
                left: 80
            },
            xLabel: _plotClause.xColumn.identifier,
            yLabel: _plotClause.yColumn.identifier
        };
    }

    protected override _plotRows(rowArray: CellValue[][]): SVGSVGElement {
        let points: [number, number][] = [];
        for (let row of rowArray) {
            const x = Number(row[0]);
            const y = Number(row[1]);
            if (!isNaN(x) && !isNaN(y)) {
                points.push([x, y]);
            }
        }
        points = this._sliceRows(points.sort((p1, p2) => p1[0] - p2[0]));
        return this._plotClause.plotFunction === "SCATTER"
            ? scatterPlot(points, this._plotConfig)
            : lineChart(points, this._plotConfig);
    }

    protected override get _columnMetadata(): ColumnMetadata[] {
        return [
            this._plotClause.xColumn,
            this._plotClause.yColumn
        ];
    }
}

function _isSatisfied(row: object, whereCondition: WhereCondition): boolean {
    const key = Object.keys(whereCondition)[0];
    switch (key) {
        case "and":
            const { and } = whereCondition as AndCondition;
            return and.every(condition => _isSatisfied(row, condition));
        case "or":
            const { or } = whereCondition as OrCondition;
            return or.some(condition => _isSatisfied(row, condition));
        case "gt":
            const { gt } = whereCondition as GreaterThanCondition;
            return row[gt.key] > gt.value;
        case "gte":
            const { gte } = whereCondition as GreaterThanOrEqualCondition;
            return row[gte.key] >= gte.value;
        case "lt":
            const { lt } = whereCondition as LessThanCondition;
            return row[lt.key] < lt.value;
        case "lte":
            const { lte } = whereCondition as LessThanOrEqualCondition;
            return row[lte.key] <= lte.value;
        case "eq":
            const { eq } = whereCondition as EqualCondition;
            return row[eq.key] === eq.value;
        case "neq":
            const { neq } = whereCondition as NotEqualCondition;
            return row[neq.key] !== neq.value;
        default:
            throw new Error(`Invalid condition key ${key}`);
    }
}

function _computeAggregatedColumn(groupEntries: [string, d3Dsv.DSVRowString[]][],
                                  column: ColumnMetadata,
                                  groupKey: string) {
    switch (column.aggregationFunction) {
        case "MIN":
            return groupEntries.map(([_, rows]) => _columnMin(rows, column.column!));
        case "MAX":
            return groupEntries.map(([_, rows]) => _columnMax(rows, column.column!));
        case "AVG":
            return groupEntries.map(([_, rows]) => _columnSum(rows, column.column!) / rows.length);
        case "SUM":
            return groupEntries.map(([_, rows]) => _columnSum(rows, column.column!));
        case "COUNT":
            return groupEntries.map(([_, rows]) => rows.length);
        case undefined:
            if (column.column === groupKey) {
                return groupEntries.map(([key, _]) => key);
            }
        default:
            throw new Error(`Invalid or missing aggregation function type ${column.aggregationFunction ?? ""} for column ${column.column}`);
    }
}

function _columnMin(data: d3Dsv.DSVRowString[], column: string): number {
    let result = null
    for (let row of data) {
        const value = Number(row[column]);
        if (!isNaN(value) && ((result !== null && value < result) || result === null)) {
            result = value;
        }
    }
    if (result === null) {
        throw new Error(`Failed to compute MIN of empty column ${column}`)
    }
    return result;
}

function _columnMax(data: d3Dsv.DSVRowString[], column: string): number {
    let result = null
    for (let row of data) {
        const value = Number(row[column]);
        if (!isNaN(value) && ((result !== null && value > result) || result === null)) {
            result = value;
        }
    }
    if (result === null) {
        throw new Error(`Failed to compute MAX of empty column ${column}`)
    }
    return result;
}

function _columnSum(data: d3Dsv.DSVRowString[], column: string) {
    let result = 0;
    for (let row of data) {
        const value = Number(row[column]);
        if (!isNaN(value)) {
            result += value;
        }
    }
    return result
}
