/*
 *  Power BI Visualizations
 *
 *  Copyright (c) Daniel Marsh-Patrick
 *  All rights reserved.
 *  MIT License
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the ""Software""), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */

"use strict";

import "./../style/visual.less";
import powerbi from "powerbi-visuals-api";
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import VisualObjectInstance = powerbi.VisualObjectInstance;
import DataView = powerbi.DataView;
import VisualObjectInstanceEnumerationObject = powerbi.VisualObjectInstanceEnumerationObject;
import VisualObjectInstancesToPersist = powerbi.VisualObjectInstancesToPersist;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;

import { VisualSettings } from "./settings";
import * as d3select from 'd3-selection';

export class Visual implements IVisual {
    private settings: VisualSettings;
    private container: d3.Selection<any, any, any, any>;
    private host: IVisualHost;
    private tableDefinition: any;

    constructor(options: VisualConstructorOptions) {
        console.log('Visual constructor', options);
        /** Visual container */
            this.container = d3select.select(options.element)
                .append('div')
                    .append('table');
    }

    public update(options: VisualUpdateOptions) {
        this.settings = Visual.parseSettings(options && options.dataViews && options.dataViews[0]);
        var errorMsg = '';
        if (this.settings.dataPoint.tableConfiguration.trim().length > 0) {
            try {
                this.tableDefinition = JSON.parse(this.settings.dataPoint.tableConfiguration);
            }
            catch (e) {
                errorMsg = "Error parsing table definition. Enter edit mode and correct the error.";
            }
        }

        

        /** Clear down existing plot */
            this.container.selectAll('*').remove();

        /** Test 1: Data view has valid bare-minimum entries */
            let dataViews = options.dataViews;    
            console.log('Test 1: Valid data view...');
            if (!dataViews
                || !dataViews[0]
                || !dataViews[0].table
                || !dataViews[0].table.rows
                || !dataViews[0].table.columns
                || !dataViews[0].metadata
            ) {
                console.log('Test 1 FAILED. No data to draw table.');
                return;
            }

        
        /** If we get this far, we can trust that we can work with the data! */
            let table = dataViews[0].table;
            const hightlightTextColor = this.settings.highlightConfig.textColor
            const hightlightFontSize = this.settings.highlightConfig.fontSize
            const hightlightFontFamily = this.settings.highlightConfig.fontFamily

                            
            const customizedTextByConfigurations =  (text: string): string => {
                return  `<span style="font-family: ${hightlightFontFamily};color: ${hightlightTextColor}; font-size:${hightlightFontSize}px">${text}</span>`
            }

        /** Add table heading row and columns */
            
            let highlightTextColumnIndex: number = -1;
            let highlightTextPosition: number = -1;
            let highlightTextLength: number = -1;
            let contentColumnIndex: number = -1;
            
            let tHead = this.container
                .append('tr');
            
            table.columns.forEach(
                (col, cidx) => {
                    switch (col.displayName) {
                        case '正規語': {
                            highlightTextColumnIndex = cidx;
                            break;
                        }
                        case '文字位置': {
                            highlightTextPosition = cidx;
                            break;
                        }
                        case '文字数': {
                            highlightTextLength = cidx;
                            break;
                        }
                        case '文': {
                            contentColumnIndex = cidx;
                            break;
                        }
                    }
                     
                    tHead
                        .append('th')
                            .text(col.displayName);
                }
            );

        /** Now add rows and columns for each row of data */

    
        const isShowHighlight: boolean = [highlightTextColumnIndex , highlightTextPosition, highlightTextLength].every(el => el > -1)
        

        table.rows.forEach(
                (row) => {
                    let tRow = this.container
                        .append('tr');
                    row.forEach(
                        (col, cidx) => {
                            let colContent = col.toString()
                            if (isShowHighlight && cidx === contentColumnIndex) {
                                const hightLightText = row[highlightTextColumnIndex].toString()
                                const splitContent = this.splitContentWithCondition(colContent, hightLightText, Number(row[highlightTextPosition]), Number(row[highlightTextLength]))
                                const customizedHighlightText = customizedTextByConfigurations(hightLightText)
                                
                                colContent = splitContent.length >= 2 ? this.joinHighlightText(splitContent, customizedHighlightText) : colContent
                     
                            }
                            tRow
                                .append('td')
                                    .html(colContent);
                        }
                    )
                }
            );
            console.log('Table rendered!');
        
    }

    private splitContentWithCondition = (content: string, keyword: string, index: number, length: number): Array<String> =>{
        let result = []
        if (content.slice(index, index + length) === keyword) {
            result.push(content.slice(0, index))
            result.push(content.slice(index + length, content.length))
        }
        
        return result
    }

    private joinHighlightText = (arrayString: String[], highlightText: string): string => `${arrayString[0]}${highlightText}${arrayString[1]}`

    public getSettings(): VisualSettings {
        return this.settings;
    }
    public saveConfig() {
        let general: VisualObjectInstance[] = [{
            objectName: "dataPoint",
            displayName: "Data colors",
            selector: null,
            properties: {
                tableConfiguration: this.settings.dataPoint.tableConfiguration
            }
        }];
        let propertToChange: VisualObjectInstancesToPersist = {
            replace: general
        }
        this.host.persistProperties(propertToChange);
    }

    private static parseSettings(dataView: DataView): VisualSettings {
        return VisualSettings.parse(dataView) as VisualSettings;
    }

    /**
     * This function gets called for each of the objects defined in the capabilities files and allows you to select which of the
     * objects and properties you want to expose to the users in the property pane.
     *
     */
    public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject {
        return VisualSettings.enumerateObjectInstances(this.settings || VisualSettings.getDefault(), options);
    }
}