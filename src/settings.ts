"use strict";

import { dataViewObjectsParser } from "powerbi-visuals-utils-dataviewutils";
import DataViewObjectsParser = dataViewObjectsParser.DataViewObjectsParser;
import { IGridBorderConfig } from "./models"
export class VisualSettings extends DataViewObjectsParser {
    public dataPoint: dataPointSettings = new dataPointSettings();
    public config: configSettings = new configSettings();
    public highlightConfig: HighlightTextSettings = new HighlightTextSettings();
    public valuesConfig: ValuesConfig = new ValuesConfig();
    public columnHeader: ValuesConfig = new ValuesConfig();
    public horizontalGridConfig: HorizontalGridConfig = new HorizontalGridConfig();
    public verticalGridConfig: VerticalGridConfig = new VerticalGridConfig();
    public allGridBorder: GridBorderConfig = new GridBorderConfig();
    public headerGridBorder: GridBorderConfig = new GridBorderConfig();
    public valueSectionGridBorder: GridBorderConfig = new GridBorderConfig();
    public gridOptions: GridOptions = new GridOptions();
    public tableSize: TableSize = new TableSize();
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
    public headerTextColor: string = "#fff";
    public headerBackgroundColor: string = "#4584D3";
    public alterTextColor: string = "#09124F";
    public alterBackgroundColor: string = "#C5E0F6";
    public show: boolean = false;
    public textWrap: boolean = false;
    public bold: boolean = false;
    public ilatic: boolean = false;
    public underline: boolean = false;
    public alignmentText: string = "";
    public fontSize: number = 10;
    public fontFamily: string = "Arial"
    public fontStyle: any = "italic"
}

export class TableSize {
    public columnSizes: string = '[]'
}

export class HorizontalGridConfig {
    public show: boolean = true;
    public horizontalGridlinesWidth: number = 1;
    public horizontalGridlinesColor: string = "#09124F";
}
export class VerticalGridConfig {
    public show: boolean = true;
    public verticalGridlinesWidth: number = 1;
    public verticalGridlinesColor: string = "#09124F";
}


export class GridBorderConfig implements IGridBorderConfig {
    public topBorder : boolean = false;
    public botBorder : boolean = false;
    public leftBorder : boolean = false;
    public rightBorder : boolean = false;
    public width : number = 1;
    public color : string = "#F00505"
}

export class GridOptions {
    public rowPadding: number = 1;
    public globalFontSize: number = 9
}