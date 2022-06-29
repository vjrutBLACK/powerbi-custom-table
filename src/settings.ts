"use strict";

import { dataViewObjectsParser } from "powerbi-visuals-utils-dataviewutils";
import DataViewObjectsParser = dataViewObjectsParser.DataViewObjectsParser;

export class VisualSettings extends DataViewObjectsParser {
    public dataPoint: dataPointSettings = new dataPointSettings();
    public config: configSettings = new configSettings();
    public highlightConfig: HighlightTextSettings = new HighlightTextSettings();
    public valuesConfig: ValuesConfig = new ValuesConfig();
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


export class ValuesConfig {
    public textColor: string = "#09124F";
    public backgroundColor: string = "#97CBF4";
    public alterTextColor: string = "#09124F";
    public alterBackgroundColor: string = "#C5E0F6";
    public textWrap: boolean = false;
    public bold: boolean = false;
    public ilatic: boolean = false;
    public underline: boolean = false;
    public fontSize: number = 10;
    public fontFamily: string = "Arial"
}
