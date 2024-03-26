export interface PlotConfig {
    containerWidth: number;
    containerHeight: number;
    margin: SVGMargin;
    xLabel?: string;
    yLabel?: string;
}

export interface SVGMargin {
    top: number;
    right: number;
    bottom: number;
    left: number;
}

export function getShape(config: PlotConfig): [number, number] {
    const width = config.containerWidth - config.margin.left - config.margin.right;
    const height = config.containerHeight - config.margin.top - config.margin.bottom;
    return [width, height];
}
