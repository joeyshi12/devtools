import * as path from "node:path";

export const commonConfig = {
    entry: {
        "jdtt": "./src/jdtt",
        "csv_vis": "./src/csv_vis"
    },
    output: {
        path: path.join(__dirname, "../app/static"),
        filename: "js/[name].js",
        chunkFormat: "array-push",
        hashFunction: "sha256"
    },
    resolve: {
        extensions: [".ts", ".js"]
    },
    performance: {
        hints: false
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                use: {
                    loader: "ts-loader"
                }
            }
        ]
    }
};
