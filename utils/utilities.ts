import * as d3 from "d3";
import { VisualSettings } from '../src/settings';
import powerbi from "powerbi-visuals-api";
import PrimitiveValue = powerbi.PrimitiveValue;
import ISelectionId = powerbi.visuals.ISelectionId;

import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;

export function addRow(el: HTMLTableRowElement, rowData, indx: number, settings: VisualSettings, isShowHighlight, highlightTextColumnIndex, contentColumnIndex, customizedTextByConfigurations) {
    d3.select(el).selectAll("td")
        .data(rowData.values)
        .enter().each( function (this, d, i) {
            let colContent = d.toString()
            if (isShowHighlight && i === contentColumnIndex) {
                
                                const hightLightText = rowData.values[highlightTextColumnIndex].toString()
                                const customizedHighlightText = customizedTextByConfigurations(hightLightText)
                                const newColContent = colContent.replace(hightLightText, customizedHighlightText)             
                                    d3.select(this)
                                        .append('td').attr('title', colContent).style('max-width', '400px').html(newColContent);
                                return;
            }
            if (i === contentColumnIndex) {
                d3.select(this)
                    .append('td').attr('title', colContent).style('max-width', '400px').html(colContent);
                    return;
            }
            
            d3.select(this)
                    .append('td').attr('title', colContent).html(colContent);
            }
        )


}

export function visualTransform(options: VisualUpdateOptions, host: IVisualHost, vSettings: VisualSettings) {

    // get references to the dataview for this update
    let dataViews = options.dataViews;

    let viewModel = {
        tableRows: [],
        data: [],
        columnOrder: [],
        settings: vSettings
    }


    // when the dataView is empty -- in all applicable attributes -- return the blank viewModel: HarveyBallViewModel
    if (!dataViews
        || !dataViews[0]
        || !dataViews[0].table
        || !dataViews[0].table.rows
        || !dataViews[0].table.columns
        || !dataViews[0].metadata
    ) {
        console.log('return blank')
        return viewModel;
    }
    
    // setup local variables if table view exists
    var dataRows = dataViews[0].table.rows
    var dataColumns = dataViews[0].table.columns

    // get table rows and apply order
    for (let ridx = 0; ridx < dataRows.length; ridx++) {
        let temp = {
            values: [],
            selectionIds: []
        }
        for (let colIndex = 0; colIndex < dataColumns.length; colIndex++) {
            let tempDatapoint = {
                value: null,
                selectionId: null,
                column: null,
                format: null,
                identity: null,
                selected: false
            }
            temp.values.push(dataRows[ridx][colIndex])
            tempDatapoint.value = dataRows[ridx][colIndex]
            const selectionId: ISelectionId = host.createSelectionIdBuilder()
                .withTable(dataViews[0].table, ridx)
                .createSelectionId();
            temp.selectionIds.push(selectionId)
            tempDatapoint.selectionId = selectionId
            tempDatapoint.identity = selectionId
            viewModel.data.push(tempDatapoint)
        }
        viewModel.tableRows.push(temp)
    }


    return viewModel;
    
}