
import {
    IBehaviorOptions,
    BaseDataPoint,
    IInteractiveBehavior,
    ISelectionHandler,
} from "powerbi-visuals-utils-interactivityutils/lib/interactivityBaseService";

import $ from "jquery";
import * as d3 from "d3";
export type Selection<T extends d3.BaseType> = d3.Selection<T, any,any, any>;



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
            elementsSelection,
            dataPoints
        } = this.options;
 
        elementsSelection.on("click", (datum) => {

            let sentDatumb = dataPoints.find(el => Object.assign(el).value == datum)
            const mouseEvent: MouseEvent = window.event as MouseEvent;
            mouseEvent && this.selectionHandler.handleSelection(sentDatumb, mouseEvent.ctrlKey);
            $(d3.event.target.parentNode).children("*").css("opacity",1)
        });
    }

    protected bindClearCatcher() {
      // ...
    }

    protected bindContextMenu() {
        const {
            elementsSelection,
            dataPoints
        } = this.options;
    
        elementsSelection.on("contextmenu", (datum) => {
            const event: MouseEvent = window.event as MouseEvent;
            if (event) {
                console.log('Button Click');
                let sentDatumb = dataPoints.find(el => Object.assign(el).value == datum)
                this.selectionHandler.handleContextMenu(
                    sentDatumb,
                    {
                        x: event.clientX,
                        y: event.clientY
                    });
                event.preventDefault();
            }
        });
    }

    public bindEvents(
        options: BaseBehaviorOptions<SelectableDataPointType>,
        selectionHandler: ISelectionHandler): void {  
        this.options = options;
        this.selectionHandler = selectionHandler;
        this.bindClick();
        this.bindClearCatcher();
        this.bindContextMenu();
    }

    public renderSelection(hasSelection: boolean): void {
        this.options.elementsSelection.style("opacity", (category: any) => {
            if (hasSelection && !category.selected) {
                return 0.3;
            } else {
                return 1;
            }
        });
    }
}
