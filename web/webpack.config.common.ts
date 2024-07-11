import * as path from "node:path";

export const commonConfig = {
    entry: {
        "jdtt": {
            import: "./src/jdtt",
            dependOn: "ace"
        },
        "csv_vis": {
            import: "./src/csv_vis",
            dependOn: "ace"
        },
        "dns": "./src/dns",
        "ace": "ace-builds",
        "worker-json": "ace-builds/src-min-noconflict/worker-json.js"
    },
    output: {
        path: path.join(__dirname, "../app/static"),
        filename: "js/[name].js",
        chunkFormat: "array-push",
        hashFunction: "sha256"
    },
    optimization: {
        runtimeChunk: "single"
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
