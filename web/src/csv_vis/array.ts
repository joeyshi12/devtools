export function zip(arr1: any[], arr2: any[]) {
    if (arr1.length !== arr2.length) {
        throw new Error("Cannot zip arrays of different lengths");
    }
    return arr1.map((value, i) => [value, arr2[i]]);
}

