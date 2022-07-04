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
// import { IGridBorderConfig } from "/models";
import * as d3select from 'd3-selection';
import $ from 'jquery';
import { cloneDeep } from 'lodash';

var tables = document.getElementsByTagName('table');
for (var i=0; i<tables.length;i++){
 resizableGrid(tables[i]);
}

function resizableGrid(table) {
 var row = table.getElementsByTagName('tr')[0],
 cols = row ? row.children : undefined;
 if (!cols) return;
 
 table.style.overflow = 'hidden';
 
 var tableHeight = table.offsetHeight;
 
 for (var i=0;i<cols.length;i++){
  var div = createDiv(tableHeight);
  cols[i].appendChild(div);
  cols[i].style.position = 'relative';
  setListeners(div);
 }

 function setListeners(div){
  var pageX,curCol,nxtCol,curColWidth,nxtColWidth;

  div.addEventListener('mousedown', function (e) {
   curCol = e.target.parentElement;
   nxtCol = curCol.nextElementSibling;
   pageX = e.pageX; 
 
   var padding = paddingDiff(curCol);
 
   curColWidth = curCol.offsetWidth - padding;
   if (nxtCol)
    nxtColWidth = nxtCol.offsetWidth - padding;
  });

  div.addEventListener('mouseover', function (e) {
   e.target.style.borderRight = '2px solid #0000ff';
  })

  div.addEventListener('mouseout', function (e) {
   e.target.style.borderRight = '';
  })

  document.addEventListener('mousemove', function (e) {
   if (curCol) {
    var diffX = e.pageX - pageX;
 
    if (nxtCol)
     nxtCol.style.width = (nxtColWidth - (diffX))+'px';

    curCol.style.width = (curColWidth + diffX)+'px';
   }
  });

  document.addEventListener('mouseup', function (e) { 
   curCol = undefined;
   nxtCol = undefined;
   pageX = undefined;
   nxtColWidth = undefined;
   curColWidth = undefined
  });
 }
 
 function createDiv(height){
  var div = document.createElement('div');
  div.style.top = '0';
  div.style.right = '0';
  div.style.width = '5px';
  div.style.position = 'absolute';
  div.style.cursor = 'col-resize';
  div.style.userSelect = 'none';
  div.style.height = height + 'px';
  return div;
 }
 
 function paddingDiff(col){
 
  if (getStyleVal(col,'box-sizing') == 'border-box'){
   return 0;
  }
 
  var padLeft = getStyleVal(col,'padding-left');
  var padRight = getStyleVal(col,'padding-right');
  return (parseInt(padLeft) + parseInt(padRight));

 }

 function getStyleVal(elm,css){
  return (window.getComputedStyle(elm, null).getPropertyValue(css))
 }
};

export class Visual implements IVisual {
    private target: HTMLElement;
    private settings: VisualSettings;
    private container: d3.Selection<any, any, any, any>;
    private host: IVisualHost;
    private tableDefinition: any;

    
    constructor(options: VisualConstructorOptions) {
        console.log('Visual constructor', options);


        /** Visual container */
        this.target = options.element;
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


        // if (this.settings.gridBorder.section === currentGridBorderSection) {

        //     console.log('true')

        //     switch (this.settings.gridBorder.section) {
        //         case 'all': {
        //             console.log('all : ', allBorder )
        //             allBorder.topBorder = this.settings.gridBorder.topBorder;
        //             allBorder.botBorder = this.settings.gridBorder.botBorder;
        //             allBorder.rightBorder = this.settings.gridBorder.rightBorder;
        //             allBorder.leftBorder = this.settings.gridBorder.leftBorder;
        //             console.log(allBorder)
        //             break;
        //         }
        //         case 'column_header': {
        //             console.log('header')
        //             console.log('hed top:', this.settings.gridBorder.topBorder)
        //             columnHeader.topBorder = this.settings.gridBorder.topBorder;
        //             columnHeader.botBorder = this.settings.gridBorder.botBorder;
        //             columnHeader.rightBorder = this.settings.gridBorder.rightBorder;
        //             columnHeader.leftBorder = this.settings.gridBorder.leftBorder;
        //             console.log(columnHeader)

        //             break;
        //         }
        //         case 'value_section': {
        //             console.log('value_section : ', valueSection)
        //             valueSection.topBorder = this.settings.gridBorder.topBorder;
        //             valueSection.botBorder = this.settings.gridBorder.botBorder;
        //             valueSection.rightBorder = this.settings.gridBorder.rightBorder;
        //             valueSection.leftBorder = this.settings.gridBorder.leftBorder;
        //             console.log(valueSection)

        //             break;
        //         }
        //     }
        
        // } else {
        //         console.log('differ')
        //     switch (this.settings.gridBorder.section) {
        //         case 'all': {
        //             console.log('bind to all', allBorder)
        //             this.settings.gridBorder.topBorder = allBorder.topBorder ;
        //             this.settings.gridBorder.botBorder = allBorder.botBorder ;
        //             this.settings.gridBorder.leftBorder = allBorder.leftBorder ;
        //             this.settings.gridBorder.rightBorder = allBorder.rightBorder ;
        //             console.log('final :', this.settings.gridBorder)

        //             break;
        //         }
        //         case 'column_header': {
        //             console.log('bind to column_header', columnHeader)

        //             this.settings.gridBorder.topBorder = columnHeader.topBorder ;
        //             this.settings.gridBorder.botBorder = columnHeader.botBorder ;
        //             this.settings.gridBorder.leftBorder = columnHeader.leftBorder ;
        //             this.settings.gridBorder.rightBorder = columnHeader.rightBorder ;
        //             console.log('final :', this.settings.gridBorder)
        //             break;
        //         }
        //         case 'value_section': {
        //             console.log('bind to value_section', valueSection)

        //             this.settings.gridBorder.topBorder = valueSection.topBorder ;
        //             this.settings.gridBorder.botBorder = valueSection.botBorder ;
        //             this.settings.gridBorder.leftBorder = valueSection.leftBorder ;
        //             this.settings.gridBorder.rightBorder = valueSection.rightBorder ;
        //             console.log('final :', this.settings.gridBorder)

        //             break;
        //         }
        //     }
        //     currentGridBorderSection = this.settings.gridBorder.section
        // }

        // console.log(this.settings.gridBorder.topBorder)

        // console.log('latest :', this.settings.gridBorder)


        
        

        /** Clear down existing plot */
            this.container.selectAll('*').remove();

        /** Test 1: Data view has valid bare-minimum entries */
            let dataViews = options.dataViews;    
            // console.log('Test 1: Valid data view...');
            if (!dataViews
                || !dataViews[0]
                || !dataViews[0].table
                || !dataViews[0].table.rows
                || !dataViews[0].table.columns
                || !dataViews[0].metadata
            ) {
                // console.log('Test 1 FAILED. No data to draw table.');
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
        
        const alterTextColor = this.settings.valuesConfig.alterTextColor
        const textColor = this.settings.valuesConfig.textColor
        const backgroundColor = this.settings.valuesConfig.backgroundColor
        const alterBackgroundColor = this.settings.valuesConfig.alterBackgroundColor
        const isWrappedText = this.settings.valuesConfig.textWrap
                
        let tBody = this.container.append('tbody')

        table.rows.forEach(
                (row, idx) => {
                    let tRow = tBody
                        .append('tr');

                    tRow
                        .style('backgroundColor', backgroundColor)
                        .style('text', textColor)
                        .style('font-family', this.settings.valuesConfig.fontFamily)
                        .style('font-size', `${this.settings.valuesConfig.fontSize}pt`)
                        .style('font-weight', this.settings.valuesConfig.bold ? 700 : 500)
                        .style('font-style', this.settings.valuesConfig.ilatic ? 'italic' : 'unset')
                        .style('text-decoration', this.settings.valuesConfig.underline ? 'underline' : 'none');
                    if(idx % 2 == 1) {
                        tRow
                            .style('backgroundColor', alterBackgroundColor)
                            .style('text', alterTextColor);
                    }
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
                                .append('td').html(colContent);
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
                }
            );

            if (isWrappedText) $(this.target).find("td").css('white-space','normal')
            if (!this.settings.horizontalGridConfig.show) {
                $(this.target).find("td").addClass('removed-horizontal-lines')
                $(this.target).find("th").addClass('removed-horizontal-lines')
            } else {
                const horCss = `${this.settings.horizontalGridConfig.horizontalGridlinesWidth}px solid ${this.settings.horizontalGridConfig.horizontalGridlinesColor}`
                $(this.target).find("td").css({
                    'border-bottom': horCss,
                    'border-top': horCss,
                })
                $(this.target).find("th").css({
                    'border-bottom': horCss,
                    'border-top': horCss,
                })
            }
            if (!this.settings.verticalGridConfig.show) {
                $(this.target).find("td").addClass('removed-vertical-lines')
                $(this.target).find("th").addClass('removed-vertical-lines')
            } else {
                const verCss = `${this.settings.verticalGridConfig.verticalGridlinesWidth}px solid ${this.settings.verticalGridConfig.verticalGridlinesColor}`
                $(this.target).find("td").css({
                    'border-right': verCss,
                    'border-left': verCss,
                })
                $(this.target).find("th").css({
                    'border-right': verCss,
                    'border-left': verCss,
                })
            }
            console.log('Table rendered!');

            const rowPadding = this.settings.gridOptions.rowPadding
            $(this.target).find("td").css('padding', `${rowPadding}px`)

            this.updatingBorder(tHead, tBody, this.settings.allGridBorder, 'all')
            this.updatingBorder(tHead, tBody, this.settings.headerGridBorder, 'header')
            this.updatingBorder(tHead, tBody, this.settings.valueSectionGridBorder, 'value')

            resizableGrid(document.getElementsByTagName('table')[0])
    }


    private updatingBorder(tHead, tBody, setting, sectionName) {

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

    private addElementBorder (element, setting, borderSetting) {
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