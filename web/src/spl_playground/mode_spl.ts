import "ace-builds/src-min-noconflict/ace";

class SPLHighlightRules extends ace.require("ace/mode/text_highlight_rules").TextHighlightRules {
    constructor() {
        super();
        const keywordMapper = this.createKeywordMapper({
            "support.function": "bar|line|scatter|min|max|avg|count|sum",
            "constant.language": "null",
            "keyword": "plot|as|select|where|groupby|limit|offset|and|or"
        }, "identifier", true);
        this.$rules = {
            "start": [
                {
                    token: "variable", // single line
                    regex: '["](?:(?:\\\\.)|(?:[^"\\\\]))*?["]\\s*(?=:)'
                },
                {
                    token: "string", // ' string
                    regex: "'.*?'"
                },
                {
                    token: "constant.numeric", // integer
                    regex: "[+-]?\\d+\\b"
                },
                {
                    token: "constant.language.boolean",
                    regex: "(?:true|false)\\b"
                },
                {
                    token: keywordMapper,
                    regex: "[a-zA-Z_$][a-zA-Z0-9_$]*\\b"
                },
                {
                    token: "text",
                    regex: "\\s+"
                }
            ]
        };
        this.normalizeRules();
    }
}

export class SPLEditorMode extends ace.require("ace/mode/text").Mode {
    constructor() {
        super();
        this.HighlightRules = SPLHighlightRules;
    }
}
