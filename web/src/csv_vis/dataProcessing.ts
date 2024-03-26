import { PQLSyntaxTree, UsingAttribute } from "pql-parser";

export function processData(data: any[], syntaxTree: PQLSyntaxTree): [any[], any[]] {
    if (syntaxTree.usingAttributes.length !== 2) {
        throw new Error(`Invalid number of attributes ${syntaxTree.usingAttributes.length}`);
    }
    const [xAttr, yAttr] = syntaxTree.usingAttributes;
    let x: any[];
    let y: any[];
    if (!syntaxTree.groupByColumn) {
        x = data.map(row => row[xAttr.column]);
        y = data.map(row => row[yAttr.column]);
    } else {
        const groups: Map<string, any[]> = new Map();
        data.forEach(row => {
            if (groups.has(row[syntaxTree.groupByColumn])) {
                groups.get(row[syntaxTree.groupByColumn]).push(row);
            } else {
                groups.set(row[syntaxTree.groupByColumn], [row]);
            }
        });
        x = [];
        y = [];
        groups.forEach((rows: any[]) => {
            x.push(computeAggregateValue(rows, xAttr, syntaxTree.groupByColumn));
            y.push(computeAggregateValue(rows, yAttr, syntaxTree.groupByColumn));
        });
    }
    switch (syntaxTree.plotType) {
        case "BAR":
            return [x.map(val => Number(val)), y];
        case "LINE":
            return [x.map(val => Number(val)), y.map(val => Number(val))];
        case "SCATTER":
            return [x.map(val => Number(val)), y.map(val => Number(val))];
        default:
            throw new Error(`Invalid plot type ${syntaxTree.plotType}`)
    }
}

function computeAggregateValue(data: any[], attribute: UsingAttribute, groupByColumn: string) {
    switch (attribute.aggregationFunction) {
        case "AVG":
            return columnSum(data, attribute.column) / data.length;
        case "SUM":
            return columnSum(data, attribute.column);
        case "COUNT":
            return data.length;
        default:
    }
    if (attribute.column === groupByColumn) {
        return data[0][attribute.column];
    }
    throw new Error(`Invalid attribute ${attribute}`)
}

function columnSum(data: any[], column: string) {
    let sum = 0;
    data.forEach(row => {
        sum += row[column];
    });
    return sum;
}
