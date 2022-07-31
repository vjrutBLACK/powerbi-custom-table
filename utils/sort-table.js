let cPrev = -1;
let isASCDirection = true
import $ from "jquery"
export function sortTable(c) {
    let table = $('#custom-table')[0];
    let  rows = table.rows.length; // num of rows
    let columns = table.rows[0].cells.length; // num of columns
    let   arrTable = [...Array(rows)].map(e => Array(columns)); // create an empty 2d array
        
        function cleanString(s) {
           return s.replace( /(<([^>]+)>)/ig, '');
        }
    
        for (let ro=0; ro<rows; ro++) { // cycle through rows
            for (let co=0; co<columns; co++) { // cycle through columns
                // assign the value in each row-column to a 2d array by row-column
                arrTable[ro][co] = table.rows[ro].cells[co]?.innerHTML;
            }
        }
    
        let  th = arrTable.shift(); // remove the header row from the array, and save it
        
        if (c !== cPrev) { // different column is clicked, so sort by the new column
            isASCDirection = true
            arrTable.sort(
                function (a, b) {
                    if (cleanString(a[c]) === cleanString(b[c])) {
                        return 0;
                    } else {
                        return cleanString(a[c]).localeCompare(cleanString(b[c]), 'ja');
                    }
                }
            );
        } else { // if the same column is clicked then reverse the array
            arrTable.reverse();
            isASCDirection = !isASCDirection
        }
        
        cPrev = c; // save in previous c
    
        arrTable.unshift(th); // put the header back in to the array
    
        // cycle through rows-columns placing values from the array back into the html table
        for (let ro=0; ro<rows; ro++) {
            for (let co=0; co<columns; co++) {
                table.rows[ro].cells[co] ? table.rows[ro].cells[co].innerHTML = arrTable[ro][co] : ''
                table.rows[ro].cells[co] ? table.rows[ro].cells[co].title = arrTable[ro][co] : ''
            }
        }

        return isASCDirection

  }
