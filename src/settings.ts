"use strict";

import { dataViewObjectsParser } from "powerbi-visuals-utils-dataviewutils";
import DataViewObjectsParser = dataViewObjectsParser.DataViewObjectsParser;

export class VisualSettings extends DataViewObjectsParser {
    public dataPoint: dataPointSettings = new dataPointSettings();
    public config: configSettings = new configSettings();
    public highlightConfig: HighlightTextSettings = new HighlightTextSettings();
}

export class dataPointSettings {
    public tableConfiguration: string = "";
}

export class configSettings {
    public exportExcel: boolean = false;
}

export class HighlightTextSettings {
    public textColor: string = "#FF0000";
    public fontSize: number = 10;
    public fontFamily: string = "Arial"
}
