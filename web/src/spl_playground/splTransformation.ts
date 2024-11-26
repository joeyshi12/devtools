import { AndCondition, ColumnMetadata, EqualCondition, GreaterThanCondition, GreaterThanOrEqualCondition, LessThanCondition, LessThanOrEqualCondition, NotEqualCondition, OrCondition, SPLQuery, WhereCondition } from "spl-parser";

export type ColumnData = {
    name: string;
    data: any[];
};

export function transformData(data: object[], query: SPLQuery): ColumnData[] {
    data = query.whereCondition ? data.filter(row => _isSatisfied(row, query.whereCondition)) : data;
    if (!query.groupKey) {
        return query.selectColumns.map(column => ({
            name: column.identifier,
            data: data.map(row => row[column.column!])
        }));
    }
    const groups: Map<any, any[]> = new Map();
    for (let row of data) {
        const groupByValue = row[query.groupKey];
        if (groups.has(groupByValue)) {
            groups.get(groupByValue)!.push(row);
        } else {
            groups.set(groupByValue, [row]);
        }
    }
    const groupEntries: [any, any[]][] = Array.from(groups.entries());
    return query.selectColumns.map(column => ({
        name: column.identifier,
        data: _computeAggregatedColumn(groupEntries, column)
    }));
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
            return row[lt.key] >= lt.value;
        case "lte":
            const { lte } = whereCondition as LessThanOrEqualCondition;
            return row[lte.key] >= lte.value;
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

function _computeAggregatedColumn(groupEntries: [any, any[]][], column: ColumnMetadata) {
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
            if (column.column === this.groupByColumn) {
                return groupEntries.map(([key, _]) => key);
            }
        default:
            throw new Error(`Invalid aggregation function type ${column.aggregationFunction}`);
    }
}

function _columnMin(data: any[], column: string): number {
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

function _columnMax(data: any[], column: string): number {
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

function _columnSum(data: any[], column: string) {
    let result = 0;
    for (let row of data) {
        const value = Number(row[column]);
        if (!isNaN(value)) {
            result += value;
        }
    }
    return result
}
