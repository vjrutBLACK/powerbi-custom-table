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
type Selection<T extends d3.BaseType> = d3.Selection<T, any,any, any>;
// @import (less) "node_modules/powerbi-visuals-utils-interactivityutils/lib/index.css";

import "./../style/visual.less";
import powerbi from "powerbi-visuals-api";
import { interactivitySelectionService, interactivityBaseService, baseBehavior } from "powerbi-visuals-utils-interactivityutils";
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
// import { IGridBorderConfig } from "/models";
import * as d3select from 'd3-selection';
import { select as d3Select } from "d3-selection";
import $ from 'jquery';
import { resizableGrid } from '../utils/resize-table'
import ISelectionManager = powerbi.extensibility.ISelectionManager;
import * as d3 from "d3";
export interface VisualDataPoint extends interactivitySelectionService.SelectableDataPoint {
    value: powerbi.PrimitiveValue;
}
import { SelectableDataPoint } from "powerbi-visuals-utils-interactivityutils/lib/interactivitySelectionService";
import {sortTable} from "../utils/sort-table";
import {
    IBehaviorOptions,
    BaseDataPoint,
    IInteractiveBehavior,
    ISelectionHandler,
} from "powerbi-visuals-utils-interactivityutils/lib/interactivityBaseService";

export interface BaseBehaviorOptions<SelectableDataPointType extends BaseDataPoint> extends IBehaviorOptions<SelectableDataPointType> {

    /** d3 selection object of the main elements on the chart */
    elementsSelection: Selection<any>;
    
    /** d3 selection object of some elements on backgroup, to hadle click of reset selection */
    clearCatcherSelection: d3.Selection<any, any, any, any>;
}



export class Behavior<SelectableDataPointType extends BaseDataPoint> implements IInteractiveBehavior {

    /** d3 selection object of main elements in the chart */
    protected options: BaseBehaviorOptions<SelectableDataPointType>;
    protected selectionHandler: ISelectionHandler;

    protected bindClick() {
        const {
            elementsSelection
        } = this.options;
      
        elementsSelection.on("click", (datum) => {
            console.log(datum);
            // const mouseEvent: MouseEvent = getEvent() as MouseEvent || window.event as MouseEvent;
            // mouseEvent && this.selectionHandler.handleSelection(
            //     datum,
            //     mouseEvent.ctrlKey);
        });
    }

    protected bindClearCatcher() {
      // ...
    }

    protected bindContextMenu() {
      // ...
    }

    public bindEvents(
        options: BaseBehaviorOptions<SelectableDataPointType>,
        selectionHandler: ISelectionHandler): void {
      // ...
    }

    public renderSelection(hasSelection: boolean): void {
      // ...
    }
}



// export interface ISelectionId {
//     equals(other: ISelectionId): boolean;
//     includes(other: ISelectionId, ignoreHighlight?: boolean): boolean;
//     getKey(): string;
//     getSelector(): Selector;
//     getSelectorsByColumn(): SelectorsByColumn;
//     hasIdentity(): boolean;
// }

export class Visual implements IVisual {
    private target: HTMLElement;
    private settings: VisualSettings;
    private container: Selection<any>;
    private host: IVisualHost;
    private tableDefinition: any;
    private selectionManager: ISelectionManager;
    private interactivity: interactivityBaseService.IInteractivityService<VisualDataPoint>;

    
    constructor(options: VisualConstructorOptions) {

        let behavior = new Behavior();

        this.host = options.host;
        
        this.selectionManager = this.host.createSelectionManager();

        this.interactivity = interactivitySelectionService.createInteractivitySelectionService(this.host);



        /** Visual container */
        this.target = options.element;
            this.container = d3select.select(options.element)
                .append('div').style('width', '2000vh')
                    .append('table').attr('id', 'custom-table');


            // this.interactivity.bind(<BaseBehaviorOptions<VisualDataPoint>>{
            //     behavior: this.behavior,
            //     dataPoints: this.categories,
            //     clearCatcherSelection: select(this.target),
            //     elementsSelection: selectionMerge
            // });

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

            // console.log('options', options)

        /** Test 1: Data view has valid bare-minimum entries */
            let dataViews = options.dataViews;    

            if (!dataViews
                || !dataViews[0]
                || !dataViews[0].categorical
                || !dataViews[0].categorical.categories
                || !dataViews[0].categorical.categories[0].source
                || !dataViews[0].categorical.categories[0].values
            ) {
                console.log('Test 1 FAILED. No data to draw table.');
                return;
            }
            
        
        /** If we get this far, we can trust that we can work with the data! */
        
            let table = dataViews[0].categorical;
            
            let category = table.categories[0];
            let dataValue = category.values;

            let dataPoint = []


            for (let i = 0; i < dataValue.length; i++) {
    
                dataPoint.push({
                    category: category.values[i] + '',
                    value: dataValue[i],
                    selectionId: this.host.createSelectionIdBuilder()
                        .withCategory(category, i)
                        .createSelectionId()
                });
            }
            // console.log(this.container.selectAll('*'));
            
            this.container.selectAll('*').data(dataPoint)
            

            // console.log('dataPoint ', dataPoint)
            const hightlightTextColor = this.settings.highlightConfig.textColor
            const hightlightFontSize = this.settings.highlightConfig.fontSize
            const hightlightFontFamily = this.settings.highlightConfig.fontFamily

                            
            const customizedTextByConfigurations =  (text: string): string => {
                return  `<span style="font-weight: 700;font-family: ${hightlightFontFamily};color: ${hightlightTextColor}; font-size:${hightlightFontSize}px">${text}</span>`
            }

        /** Add table heading row and columns */
            
            let highlightTextColumnIndex: number = -1;
            let highlightTextPosition: number = -1;
            let highlightTextLength: number = -1;
            let contentColumnIndex: number = -1;
            
            let tHead = this.container
                .append('thead')
                .append('tr');
            

            const headerTextColor = this.settings.columnHeader.headerTextColor
            const headerBackgroundColor = this.settings.columnHeader.headerBackgroundColor

            table.categories.forEach(
                (col, cidx) => {
                    switch (col.source.displayName) {
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
                            .text(col.source.displayName)
                            .style('background-color', headerBackgroundColor)
                            .style('color', headerTextColor)
                            .style('text-align', this.settings.columnHeader.alignmentText ?? "center")
                            .style('font-family', this.settings.columnHeader.fontFamily)
                            .style('font-size', `${this.settings.columnHeader.fontSize}pt`)
                            .style('font-weight', this.settings.columnHeader.bold ? 700 : 500)
                            .style('font-style', this.settings.columnHeader.ilatic ? 'italic' : 'unset')
                            .style('text-decoration', this.settings.columnHeader.underline ? 'underline' : 'none')
                            ;
                }   
            );

            // <div "true" class="powervisuals-glyph sort-icon caret-up " style="font-size:7.573333333333332px;bottom:2px;"></div>

        /** Now add rows and columns for each row of data */

        

    
        const isShowHighlight: boolean = [highlightTextColumnIndex , highlightTextPosition, highlightTextLength].every(el => el > -1)
        
        const alterTextColor = this.settings.valuesConfig.alterTextColor
        const textColor = this.settings.valuesConfig.textColor
        const backgroundColor = this.settings.valuesConfig.backgroundColor
        const alterBackgroundColor = this.settings.valuesConfig.alterBackgroundColor
        const isWrappedText = this.settings.valuesConfig.textWrap
                
        let tBody = this.container.append('tbody')

        let newArray = [];
        table.categories.forEach((el,idx) => {
            let valuesLength = el.values.length
            el.values.forEach((r,ridx) => {
                if (newArray.length < valuesLength) newArray.push([])
                newArray[ridx][idx] = r
            })
            
        })
        newArray.forEach( (row, idx) => {
            let tRow = tBody
                .append('tr');

            tRow
                .style('background-color', backgroundColor)
                .style('color', textColor)
                .style('font-family', this.settings.valuesConfig.fontFamily)
                .style('font-size', `${this.settings.valuesConfig.fontSize}pt`)
                .style('font-weight', this.settings.valuesConfig.bold ? 700 : 500)
                .style('font-style', this.settings.valuesConfig.ilatic ? 'italic' : 'unset')
                .style('text-decoration', this.settings.valuesConfig.underline ? 'underline' : 'none');
            if(idx % 2 == 1) {
                tRow
                    .style('background-color', alterBackgroundColor)
                    .style('color', alterTextColor);
            }

            row.forEach(
                (col, cidx) => {
                    let colContent = col.toString()
                    if (isShowHighlight && cidx === contentColumnIndex) {
                        const hightLightText = row[highlightTextColumnIndex].toString()
                        const customizedHighlightText = customizedTextByConfigurations(hightLightText)             
                    }

                    if (cidx === contentColumnIndex) {
                        tRow
                        .append('td').attr('title', colContent).style('max-width', '400px').html(colContent);
                    } else tRow
                        .append('td').attr('title', colContent).html(colContent);
                    tRow
                        .style('background-color', backgroundColor)
                        .style('color', textColor);
                       
                    if(idx % 2 === 1) {
                        tRow
                            .style('background-color', alterBackgroundColor)
                            .style('color', alterTextColor);
                    }

                }
            )
        });
                

            if (isWrappedText) $(this.target).find("td").css('white-space','normal')
            if (!this.settings.horizontalGridConfig.show) {
                $(this.target).find("td").addClass('removed-horizontal-lines')
                $(this.target).find("th").addClass('removed-horizontal-lines')
            } else {
                const horCSS = `${this.settings.horizontalGridConfig.horizontalGridlinesWidth}px solid ${this.settings.horizontalGridConfig.horizontalGridlinesColor}`
                $(this.target).find("td").css({
                    'border-bottom': horCSS,
                    'border-top': horCSS,
                })
                $(this.target).find("th").css({
                    'border-bottom': horCSS,
                    'border-top': horCSS,
                })
            }
            if (!this.settings.verticalGridConfig.show) {
                $(this.target).find("td").addClass('removed-vertical-lines')
                $(this.target).find("th").addClass('removed-vertical-lines')
            } else {
                const verCSS = `${this.settings.verticalGridConfig.verticalGridlinesWidth}px solid ${this.settings.verticalGridConfig.verticalGridlinesColor}`
                $(this.target).find("td").css({
                    'border-right': verCSS,
                    'border-left': verCSS,
                })
                $(this.target).find("th").css({
                    'border-right': verCSS,
                    'border-left': verCSS,
                })
            }

            const rowPadding = this.settings.gridOptions.rowPadding
            const globalFontSize = this.settings.gridOptions.globalFontSize
            $(this.target).find("td").css('padding', `${rowPadding}px`)
            $(this.target).find("td").css('font-size', `${globalFontSize}px`)

            this.updatingBorder(tHead, tBody, this.settings.allGridBorder, 'all')
            this.updatingBorder(tHead, tBody, this.settings.headerGridBorder, 'header')
            this.updatingBorder(tHead, tBody, this.settings.valueSectionGridBorder, 'value')


            
            resizableGrid(document.getElementsByTagName('table')[0])
    
            let selectionManager = this.selectionManager;
            let allowInteractions = this.host.allowInteractions;

            console.log('Table rendered!');

            this.bindingHeaderClicking()
            
            this.addTooltip()
            // console.log('dataViews[0].categorical', dataViews[0])

            // let identity = this.host.createSelectionIdBuilder()
            // .withCategory(categories, i)
            // .createSelectionId()
            
            // console.log(tBody)
            // d3.selectAll()
    }

    
    private addTooltip = () => {
        $('td').tooltip();
    }
    

    private updatingBorder = (tHead, tBody, setting, sectionName) => {

        // resolve for all section
        const gridBorderDetail = `${setting.width}px solid ${setting.color}`
        switch (sectionName) {
            case 'all': {
                    this.addElementBorder(tHead, setting, gridBorderDetail)
                    this.addElementBorder(tBody, setting, gridBorderDetail)
            }
            case 'header': {
                this.addElementBorder(tHead, setting, gridBorderDetail)
            }
            case 'value': {
                this.addElementBorder(tBody, setting, gridBorderDetail)
            }
        }
    }

    private addElementBorder =  (element, setting, borderSetting) => {
        if (setting.topBorder) element.style('border-top', borderSetting)
        if (setting.leftBorder) element.style('border-bottom', borderSetting)
        if (setting.leftBorder ) element.style('border-left', borderSetting)
        if (setting.rightBorder) element.style('border-right', borderSetting)
    }

    private splitContentWithCondition = (content: string, keyword: string, index: number, length: number): Array<String> =>{
        let result = []
        if (content.slice(index, index + length) === keyword) {
            result.push(content.slice(0, index))
            result.push(content.slice(index + length, content.length))
        }
        
        return result
    }

    private bindingHeaderClicking () {
        $('th').each((indx, th) => {
            $(th).on('click', () => {
                sortTable(indx)
                // if ($('th')[indx].find('.sort-by-asc').length) {
                //     $( "<i class='sort-by-desc'></i>" ).prependTo( $('th')[indx])
                //     $('th > i.sort-by-asc').remove();
                // }
                // else if ($('th')[indx].find('.sort-by-desc').length) {
                //     $( "<i class='sort-by-asc'></i>" ).prependTo( $('th')[indx]) 
                //     $('th > i.sort-by-desc').remove();
                // }
            })
        })
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