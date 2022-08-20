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
import ILocalVisualStorageService = powerbi.extensibility.ILocalVisualStorageService;
import VisualObjectInstancesToPersist = powerbi.VisualObjectInstancesToPersist;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import { VisualSettings } from "./settings";
import IVisualEventService = powerbi.extensibility.IVisualEventService;
import * as d3select from 'd3-selection';
import * as d3 from "d3";

import $ from 'jquery';
import { resizableGrid } from '../utils/resize-table'
import ISelectionManager = powerbi.extensibility.ISelectionManager;

export interface VisualDataPoint extends interactivitySelectionService.SelectableDataPoint {
    value: powerbi.PrimitiveValue;
}
import {sortTable} from "../utils/sort-table";


import { addRow, visualTransform } from '../utils/utilities'
import { Behavior, Selection, BaseBehaviorOptions } from './behaviorHandler'


export class Visual implements IVisual {
    private target: HTMLElement;
    private settings: VisualSettings;
    private container: Selection<any>;
    private host: IVisualHost;
    private tableDefinition: any;
    private columnSizes = [];
    private events: IVisualEventService;
    private selectionManager: ISelectionManager;
    private interactivity: interactivityBaseService.IInteractivityService<VisualDataPoint>;

    
    constructor(options: VisualConstructorOptions) {

        this.host = options.host;
        this.events = options.host.eventService;
        this.selectionManager = this.host.createSelectionManager();

        this.interactivity = interactivitySelectionService.createInteractivitySelectionService(this.host);

        // localStorage.setItem('columnSizes',JSON.stringify(columnSizes))

        /** Visual container */
        this.target = options.element;
        this.container = d3select.select(options.element)
            .append('div')
                .append('table').attr('id', 'custom-table');


    }



    public update(options: VisualUpdateOptions) {
        this.events.renderingStarted(options);

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

            let viewModel = visualTransform(options, this.host, this.settings);

            if (!dataViews
                || !dataViews[0]
                || !dataViews[0].table
                || !dataViews[0].table.rows
                || !dataViews[0].table.columns
                || !dataViews[0].metadata
            ) {
                console.log('No data to draw table.');
                return;
            }
            
        
        /** If we get this far, we can trust that we can work with the data! */
        
            let table = dataViews[0].table;
            

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
            // @ts-ignore
            let existedColumnWidth = Object.values(this.settings.columnWidth)
            let notExistedColumn = existedColumnWidth.splice(table.columns.length || 0 , 10)
            let existedColumnId = Object.keys(this.settings.columnWidth)
            let notExistedColumnId = existedColumnId.splice(table.columns.length || 0, 10 )


            const headerTextColor = this.settings.columnHeader.headerTextColor
            const headerBackgroundColor = this.settings.columnHeader.headerBackgroundColor
            let INDEXColumnIndex = -1
            const highlightedContentColumnIndx = []

            table.columns.forEach(
                (col, cidx) => {

                    
                    const columnName = Object.assign(col.expr).ref || Object.assign(col.expr).arg.ref
                    if (columnName === '文' || columnName.indexOf('文_') > -1) highlightedContentColumnIndx.push(cidx)
                    switch (columnName) {
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
                        case 'INDEX': {
                            INDEXColumnIndex = cidx;
                            break;
                        }
                    }

                    tHead
                        .append('th')
                            .style('background-color', headerBackgroundColor)
                            .style('color', headerTextColor)
                            .style('text-align', this.settings.columnHeader.alignmentText ?? "center")
                            .style('font-family', this.settings.columnHeader.fontFamily)
                            .style('font-size', `${this.settings.columnHeader.fontSize}pt`)
                            .style('font-weight', this.settings.columnHeader.bold ? 700 : 500)
                            .style('font-style', this.settings.columnHeader.ilatic ? 'italic' : 'unset')
                            .style('text-decoration', this.settings.columnHeader.underline ? 'underline' : 'none')
                            // @ts-ignore
                            .style('width', `${existedColumnWidth[cidx]}px`)
                            .style('min-width', `${existedColumnWidth[cidx]}px`)
                            .style('max-width', `${existedColumnWidth[cidx]}px`)
                            // .style('width', this.columnSizes[columnName] || "auto")
                            .append('span')
                            .text(columnName)
                            ;

                            
                }   
            );



        /** Now add rows and columns for each row of data */

    
        const isShowHighlight: boolean = [highlightTextColumnIndex , highlightTextPosition, highlightTextLength].every(el => el > -1)

        const highLightTextCondition = {
            isShowHighlight: isShowHighlight,
            highlightTextColumnIndex: highlightTextColumnIndex,
            highlightTextPosition: highlightTextPosition,
            highlightTextLength: highlightTextLength,
            contentColumnIndex: contentColumnIndex,
            highlightedContentColumnIndx: highlightedContentColumnIndx
        }
        
        const alterTextColor = this.settings.valuesConfig.alterTextColor
        const textColor = this.settings.valuesConfig.textColor
        const backgroundColor = this.settings.valuesConfig.backgroundColor
        const alterBackgroundColor = this.settings.valuesConfig.alterBackgroundColor
        const isWrappedText = this.settings.valuesConfig.textWrap
                
        let tBody = this.container.append('tbody')

        d3.select('tbody')
            .selectAll("tr")
            .data(viewModel.tableRows)
            .enter().append("tr")
            .style('background-color', backgroundColor)
            .style('color', textColor)
            .style('font-family', this.settings.valuesConfig.fontFamily)
            .style('font-size', `${this.settings.valuesConfig.fontSize}pt`)
            .style('font-weight', this.settings.valuesConfig.bold ? 700 : 500)
            .style('font-style', this.settings.valuesConfig.ilatic ? 'italic' : 'unset')
            .style('text-decoration', this.settings.valuesConfig.underline ? 'underline' : 'none')
            
            .each(function (this, d, i) { 
                if(i % 2 == 1) {
                    d3.select(this).style('background-color', alterBackgroundColor)
                                .style('color', alterTextColor);
                }
                addRow(this, d, i, highLightTextCondition, customizedTextByConfigurations); 
            })


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

        this.updatingBorder(tHead, tBody, this.settings.allGridBorder, 'all')
        this.updatingBorder(tHead, tBody, this.settings.headerGridBorder, 'header')
        this.updatingBorder(tHead, tBody, this.settings.valueSectionGridBorder, 'value')


        // this.columnSizes = resizableGrid(document.getElementsByTagName('table')[0], this.columnSizes)



        let behavior = new Behavior();
        // @ts-ignore
        this.interactivity.bind(<BaseBehaviorOptions<VisualDataPoint>>{
            behavior: behavior,
            dataPoints: viewModel.data,
            clearCatcherSelection: d3.select(this.target),
            elementsSelection: d3.selectAll('td')
        });
        
        this.bindingHeaderClicking()
        this.addTooltip()

        console.log('Table rendered!');

    }

    public destroy() {
        console.log('be destroy')
    }
    
    private addTooltip = () => {
                $('th').each(function (index, element) {
                    $(this).removeAttr( "title" )
                });
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


    private bindingHeaderClicking () {
        $('th').each((indx, th) => {
            $(th).on('click', (d) => {
                if (d.target.nodeName.toLowerCase() !== 'div') {
                    let isAscDirection = sortTable(indx);
                    $('th > i').remove();
                    // resizableGrid(document.getElementsByTagName('table')[0],this.columnSizes, true);
                    !isAscDirection ? $( "<i class='sort-by-desc'></i>" ).prependTo( $('th')[indx]) :$("<i class='sort-by-asc'></i>" ).prependTo( $('th')[indx]) ;
                }
                
            })
        })
    }

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