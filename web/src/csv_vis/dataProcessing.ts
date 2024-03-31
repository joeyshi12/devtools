import { PQLSyntaxTree, UsingAttribute } from "pql-parser";

export interface CsvRow {
    [key: string]: string;
}

export interface Point {
    x: any;
    y: any;
}

export function processData(data: CsvRow[], syntaxTree: PQLSyntaxTree): Point[] {
    if (syntaxTree.usingAttributes.length !== 2) {
        throw new Error(`Invalid number of attributes ${syntaxTree.usingAttributes.length}`);
    }

    // Validate columns in syntax tree
    const columns = Object.keys(data[0]);
    syntaxTree.usingAttributes.forEach(attribute => {
        if (attribute.column && !columns.includes(attribute.column)) {
            throw new Error(`Invalid column in using attributes [${attribute.column}]\nAvailable columns:\n${columns.join("\n")}`);
        }
    });
    if (syntaxTree.groupByColumn && !columns.includes(syntaxTree.groupByColumn)) {
        throw new Error(`Invalid group by column [${syntaxTree.groupByColumn}]\nAvailable columns:\n${columns.join("\n")}`)
    }

    // Generate attribute data
    const [xAttr, yAttr] = syntaxTree.usingAttributes;
    let x: any[];
    let y: any[];
    if (!syntaxTree.groupByColumn) {
        x = data.map(row => row[xAttr.column]);
        y = data.map(row => row[yAttr.column]);
    } else {
        const groups: Map<string, any[]> = new Map();
        data.forEach(row => {
            const groupByValue = row[syntaxTree.groupByColumn];
            if (groups.has(groupByValue)) {
                groups.get(groupByValue).push(row);
            } else {
                groups.set(groupByValue, [row]);
            }
        });
        x = [];
        y = [];
        groups.forEach((rows: any[], key) => {
            console.log(key, rows);
            x.push(computeAggregateValue(rows, xAttr, syntaxTree.groupByColumn));
            y.push(computeAggregateValue(rows, yAttr, syntaxTree.groupByColumn));
        });
    }

    // Cast attribute data based on plot type
    switch (syntaxTree.plotType) {
        case "BAR":
            return x.map((val, i) => ({ x: Number(val), y: y[i] }))
                .filter(point => !isNaN(point.x));
        case "LINE":
        case "SCATTER":
            return x.map((val, i) => ({ x: Number(val), y: Number(y[i]) }))
                .filter(point => !isNaN(point.x) && !isNaN(point.y));
        default:
            throw new Error(`Invalid plot type ${syntaxTree.plotType}`);
    }
}

function computeAggregateValue(data: CsvRow[], attribute: UsingAttribute, groupByColumn: string) {
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

function columnSum(data: CsvRow[], column: string) {
    let sum = 0;
    data.forEach(row => {
        const numValue = Number(row[column]);
        if (!isNaN(numValue)) {
            sum += numValue
        }
    });
    return sum;
}
