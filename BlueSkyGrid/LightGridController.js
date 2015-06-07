define(["require", "exports", './DataEngine', './CurrencyManager'], function (require, exports, __de, __cm) {
    // A very light grid - NO Knockout bindings at all!! - v1.0
    var LightGridController = (function () {
        function LightGridController() {
            this.dataEngine = null;
            this.colDefinitions = [];
            this.$el = undefined;
            this.$grid = undefined;
            this.$datarows = undefined;
            this.$pager = undefined;
            this.$header = undefined;
            this.$resizemarker = undefined;
            this.$resizeline = undefined;
            this.$insertmarker = undefined;
            this.$sgloading = undefined;
            this.$datascrollable = undefined;
            this._selectedPKvalue = "";
            this._isResizingColumn = false;
            this._isDraggingColumn = false;
        }
        // --------------------------------------
        // 'synchronous' creation of the grid structure
        // --------------------------------------
        LightGridController.prototype.createGrid = function ($el, colDefinitions, showBorder) {
            var self = this;
            this.$el = $el;
            this.colDefinitions = colDefinitions;
            if (showBorder == undefined || showBorder == null)
                showBorder = true;
            // create a grid string
            var grid = this.createGridStructure(showBorder);
            // create a DOM grid 
            this.$grid = $(grid);
            // add this grid to the given dom element
            this.$grid.appendTo($el);
            // get a handle to some important data parts
            this.$header = $('.header-template', this.$grid);
            this.$datarows = $('.data', this.$grid);
            this.$pager = $('.pager', this.$grid);
            this.$resizemarker = $('.resize-marker', this.$grid);
            this.$resizeline = $('.full-resize-marker', this.$grid);
            this.$insertmarker = $('.insert-marker', this.$grid);
            this.$sgloading = $('.spinner', this.$grid);
            this.$datascrollable = $('.data-scrollable', this.$grid);
            // add available pages to the 'select' element
            $.each([200, 500, 1000], function (key, value) {
                $('.page-size', this.$pager).append($("<option></option>").attr("value", key).text(value));
            });
            // handle the user changing the pagesize
            $('.page-size', this.$pager).change(function (p1) {
                var option = this.options[this.selectedIndex];
                var newsize = Number($(option).text());
                self.dataEngine.setPageSize(newsize);
                self.refreshPage(__de.NavigationAction.first);
            });
            // make sure that selections from the grid are not allowed (this prevents double click to select many cells..)
            this.$grid.disableSelection();
            // now attach some delegated events to various elements
            this.attachDelegatedHandlers();
        };
        // --------------------------------
        // assign data to the grid light
        // --------------------------------
        LightGridController.prototype.setData = function (data, colDefinitions) {
            var self = this;
            // if coldefs are given then use these ones 
            if (colDefinitions)
                this.colDefinitions = colDefinitions;
            // if there are no column definitions given (either from the constructor or with this call) then throw an erro
            if (!this.colDefinitions || this.colDefinitions.length == 0)
                throw new Error("Grid Light - missing ColDefinitions!");
            // forget any row that was selected
            this._selectedPKvalue = "";
            // create a new internal dataengine if need be
            if (!self.dataEngine) {
                self.dataEngine = new __de.DataEngine();
                // if a sort order was given through the ColDefs then set it now
                var coldef = self.colDefinitions.findItem(function (cdl) {
                    return cdl.sortDirection.length > 0;
                });
                // if a ColDefinition is found update it
                if (coldef) {
                    self.dataEngine.sortColumn = coldef.colName;
                    self.dataEngine.sortDirection = coldef.sortDirection;
                }
            }
            // hand over the given unstructured data to the dataEngine
            self.dataEngine.processData(data);
            // and instruct (async) to process the data and create the grid out of it
            return self.processDataRows();
        };
        // async - clears and re-creates the enitre grid - called when re-sorting or new data been given
        LightGridController.prototype.processDataRows = function () {
            var self = this;
            // create a deferred object ready to pass back (its promise)
            var deferred = $.Deferred();
            // show the loading spinner
            self.$sgloading.css('display', 'flex');
            // do the calculations for the flexColumn (if there is any) - do it when we still have data to prevent available incorrect parent width!
            self.assignFlexibleColWidth();
            // disconnect the work from the call to allow the grid to show the loading spinner
            setTimeout(function () {
                try {
                    // refresh the data
                    self.dataEngine.refresh(__de.NavigationAction.none);
                    // remove any rows in the 'header' and 'data' sections
                    $(self.$header).empty();
                    $(self.$datarows).empty();
                    // create the header (string and DOM and append to placeholder)
                    var header = self.createHeader();
                    $(header).appendTo(self.$header);
                    // create all rows (string and DOM and append to placeholder)
                    var rows = self.createRows();
                    $(rows).appendTo(self.$datarows);
                    // reselect the row if one was selected
                    if (self._selectedPKvalue.length > 0)
                        self.setSelected(self._selectedPKvalue, false, "auto");
                    // hide the loading spinner
                    self.$sgloading.css('display', 'none');
                    // update the navigation buttons
                    self.updatePagerButtons();
                    // attach some fixed handlers (col drag drop)
                    self.attachHandlers();
                    // check the flexible column
                    self.resized();
                    // let any waiting party know we are done
                    deferred.resolve("ok");
                }
                catch (err) {
                    // let any waiting party know an error occurred
                    deferred.reject(err);
                }
            }, 0);
            // return the promise
            return deferred.promise();
        };
        // async - clears and re-creates the datarows part of the grid - called when paging!
        LightGridController.prototype.refreshPage = function (action) {
            var self = this;
            // show the loading spinner
            self.$sgloading.css('display', 'flex');
            // disconnect the work from the call to allow the grid to show the loading spinner
            setTimeout(function () {
                // refresh the data
                self.dataEngine.refresh(action);
                self.updatePagerButtons();
                // remove any rows in '$datarows' section
                $(self.$datarows).empty();
                // create all rows 
                var rows = self.createRows();
                $(rows).appendTo(self.$datarows);
                // hide the loading spinner
                self.$sgloading.css('display', 'none');
                // check the flexible column
                self.resized();
            }, 0);
        };
        // --------------------------------
        // call this when there is a strechable column and the grid width has changed
        // --------------------------------
        LightGridController.prototype.resized = function () {
            var self = this;
            // let the control 'settle' first before attempting to set the new width of all relevant cells
            setTimeout(function () {
                // calculate the new colwidth of the stretchable column
                var newwidth = self.assignFlexibleColWidth();
                if (newwidth == -1)
                    return; // there is no flex column
                // find all cells that are decorated with 'stretchable' and set to new width
                self.$header.find(".stretchable").css('width', newwidth + "px");
                self.$datarows.find(".stretchable").css('width', newwidth + "px");
            }, 0);
        };
        // dis/en-ables the navigation buttons
        LightGridController.prototype.updatePagerButtons = function () {
            // update the current page text
            $('.pager-text', this.$pager).text(this.dataEngine.currentPage + " of " + this.dataEngine.maxPages);
            // remove the 'disabled' attribute from all buttons
            $(".btnFirstPage", this.$pager).removeAttr("disabled");
            $(".btnPrevPage", this.$pager).removeAttr("disabled");
            $(".btnNextPage", this.$pager).removeAttr("disabled");
            $(".btnLastPage", this.$pager).removeAttr("disabled");
            // disable any buttons we shouldn't click
            if (this.dataEngine.currentPage == 1) {
                $(".btnFirstPage", this.$pager).attr('disabled', 'disabled');
                $(".btnPrevPage", this.$pager).attr('disabled', 'disabled');
            }
            if (this.dataEngine.currentPage == this.dataEngine.maxPages) {
                $(".btnNextPage", this.$pager).attr('disabled', 'disabled');
                $(".btnLastPage", this.$pager).attr('disabled', 'disabled');
            }
        };
        // select the row 
        LightGridController.prototype.setSelected = function (pkvalue, dblClickOrigin, origin) {
            var self = this;
            // select the pkvalue
            self._selectedPKvalue = pkvalue;
            // if no origin was given then 
            if (!origin)
                origin = "unknown";
            // first undo the previous selected row
            var $elTarget = this.$datarows.find(".sym-selected");
            $elTarget.removeClass("sym-selected");
            // find the dom row 
            var $elTarget = this.$datarows.find("[data-pkvalue='" + pkvalue + "']");
            $elTarget.addClass("sym-selected");
            // find the actual dataItem for this pkvalue
            var dataItem = self.dataEngine.getDataItem(pkvalue);
            // if a callback was given then return the selected dataitem
            if (!dblClickOrigin && self.cbSelectedDataItem)
                self.cbSelectedDataItem(dataItem, origin);
            // if origin was a double click and a handler is given then call it
            if (dblClickOrigin && self.cbSelectedDataItemDblClick)
                self.cbSelectedDataItemDblClick(dataItem, origin);
        };
        // attaches one-off event handlers to the grid skeleton
        LightGridController.prototype.attachDelegatedHandlers = function () {
            var cellHeader;
            var initialWidth = 0;
            var initialXOffsetLeft = 0;
            var resizeColName = "";
            var self = this;
            var $grid = this.$grid;
            // start off with hiding the full vertical sizer strip
            self.$resizeline.hide();
            self.$insertmarker.hide();
            var $sgHeader = $('.header', $grid);
            $('.data-scrollable', $grid).scroll(function () {
                var newLeft = $('.data-scrollable', $grid).scrollLeft() * -1;
                $('.header', $grid).css({ left: newLeft }); // adjust the css left of the data grid and header
            });
            this.$grid.on("click", ".row", function (event) {
                // get the pk value from the data- attribute
                var pkvalue = $(this).attr('data-pkvalue');
                // and select that row
                self.setSelected(pkvalue, false, "click");
            });
            $grid.on("dblclick", ".row", function (event) {
                // get the pk value from the data- attribute
                var pkvalue = $(this).attr('data-pkvalue');
                // and select that row
                self.setSelected(pkvalue, true, "click");
            });
            // add row select functionality
            self.$resizemarker.on("dblclick", function (data) {
                self.setFlexColumn(resizeColName); // set the chosen column to be the strechable one
                self.$resizemarker.hide(); // hide the resizer marker immediately
                self.processDataRows(); // re-process the data rows fully since we need to re-assign the 'stretchable' class to another column
            });
            // attach handlers for page navigation
            $(".btnFirstPage", self.$pager).click(function () {
                self.refreshPage(__de.NavigationAction.first);
            });
            $(".btnPrevPage", self.$pager).click(function () {
                self.refreshPage(__de.NavigationAction.prev);
            });
            $(".btnNextPage", self.$pager).click(function () {
                self.refreshPage(__de.NavigationAction.next);
            });
            $(".btnLastPage", self.$pager).click(function () {
                self.refreshPage(__de.NavigationAction.last);
            });
            // 
            $sgHeader.on("click", "[data-sgcol]", function (event) {
                // get the colname of the header row
                var colName = $(this).attr('data-sgcol');
                var sortColumn = undefined;
                // step through all available coldefs
                self.colDefinitions.forEach(function (cd) {
                    if (cd.colName == colName) {
                        // hang on to which column we sorted on
                        sortColumn = cd;
                        // assign the sortColumn
                        self.dataEngine.sortColumn = colName;
                        // flip (is necessary) the sort direction
                        if (cd.sortDirection == "asc")
                            cd.sortDirection = self.dataEngine.sortDirection = "desc";
                        else
                            cd.sortDirection = self.dataEngine.sortDirection = "asc";
                    }
                    else
                        cd.sortDirection = "";
                });
                // re-process the rows
                self.processDataRows();
                // after all is updated we fire the callback
                if (self.cbSortChanged)
                    setTimeout(function () {
                        self.cbSortChanged(sortColumn);
                    }, 0);
            });
            $grid.on("mouseenter", ".cell-header", function () {
                if (self._isResizingColumn || self._isDraggingColumn)
                    return;
                cellHeader = $(this);
                resizeColName = $(this).attr('data-sgcol');
                if (!resizeColName)
                    return;
                var position = $(this).position();
                var width = $(this).width();
                var newX = position.left + width + 3;
                self.$resizemarker.show();
                self.$resizemarker.css('left', newX);
            });
            self.$resizemarker.draggable({
                containment: $sgHeader,
                opacity: 0.6,
                scroll: true,
                //helper: "clone",
                start: function (event, ui) {
                    self._isResizingColumn = true;
                    self.$resizeline.show(); // show the full resize vertical bar
                    // retrieve the mapitem for this column (so we can adjust the col width)
                    var width = $(cellHeader).outerWidth();
                    var position = $(cellHeader).position();
                    // take some initial positions we need for adjusting properly..
                    initialXOffsetLeft = ui.offset.left;
                    initialWidth = width;
                },
                stop: function (event, ui) {
                    self._isResizingColumn = false;
                    self.$resizemarker.hide(); // hide the default resize marker
                    self.$resizeline.hide(); // hide the full resize vertical bar
                    var diff = ui.offset.left - initialXOffsetLeft;
                    var newCW = initialWidth + diff;
                    if (newCW < 20)
                        newCW = 20;
                    // set the new width of the column
                    var coldef = self.getColDefinition(resizeColName);
                    coldef.width = newCW;
                    // find all cells fot this column and resize them
                    var $colElements = self.$grid.find("[data-sgcol='" + resizeColName + "']");
                    $colElements.css('width', newCW + "px");
                    // if the column that was stretched was the flex column then stop allowing it to flex itself
                    if (coldef.isFlexCol) {
                        coldef.isFlexCol = false;
                        self.$header.find(".fa-arrows-h").removeClass("fa-arrows-h");
                    }
                    // check the flexible column
                    self.resized();
                },
                drag: function (event, ui) {
                    // calculate the new col width
                    var diff = ui.offset.left - initialXOffsetLeft;
                    var newCW = initialWidth + diff;
                    if (newCW < 20)
                        newCW = 20;
                    self.$resizeline.css('left', ui.position.left + 3);
                }
            });
        };
        // Called each time the header dom elements are re-created.
        // these are jQuery ui interactions that HAVE to be created AFTER the header dom elements are created
        LightGridController.prototype.attachHandlers = function () {
            var self = this;
            var $grid = this.$grid;
            var dragStartColName;
            var dragOverColName;
            $(".cell-header", this.$header).droppable({
                over: function (event, ui) {
                    if (!self._isDraggingColumn)
                        return; // if we are not in 'dragging' mode then ignore any 'moving over' events that can be raised.
                    dragOverColName = $(this).attr('data-sgcol'); // track the colname of the column we are hovering over
                    // make sure we show the insert marker (red arrow between the columns)
                    self.$insertmarker.show();
                    // calculate insert markers position
                    var position = $(this).position();
                    var newX = position.left - 1;
                    self.$insertmarker.css('left', newX);
                },
            });
            $(".cell-header", this.$header).draggable({
                containment: $('.header-containment', $grid),
                opacity: 0.9,
                scroll: true,
                distance: 10,
                helper: "clone",
                start: function (event, ui) {
                    dragStartColName = $(this).attr('data-sgcol'); // track the start colname (the column we are dragging)
                    self._isDraggingColumn = true; // keep track that we are now dragging!
                    $(ui.helper).css('backgroundColor', 'purple');
                    $(ui.helper).css('color', 'white');
                },
                stop: function () {
                    self._isDraggingColumn = false; // we have stopped dragging
                    self.setOrderChanged(dragStartColName, dragOverColName); // instruct the actual re-ordering of columns
                    self.$insertmarker.hide(); // hide the red insert marker arrow
                },
            });
        };
        // ------------------------------------------------------------------------
        // allows this instance to quickly get a link to the active mapitem
        // ------------------------------------------------------------------------
        LightGridController.prototype.getColDefinition = function (colName) {
            return this.colDefinitions.findItem(function (cd) {
                return cd.colName == colName;
            });
        };
        // called when the column order has changed
        LightGridController.prototype.setOrderChanged = function (colStart, colInsertBefore) {
            var cStart = this.getColDefinition(colStart);
            var cInsertBefore = this.getColDefinition(colInsertBefore);
            // first remove the column we are repositioning from the array
            this.colDefinitions.remove(cStart);
            // now find the index of the target
            var i = this.colDefinitions.indexOf(cInsertBefore);
            // insert the dragging column in the right place
            this.colDefinitions.splice(i, 0, cStart);
            // re-process all rows
            this.processDataRows();
        };
        // provides callback info 
        LightGridController.prototype.getSortSymbol = function (coldef) {
            if (coldef.sortDirection.length == 0)
                return "";
            if (coldef.sortDirection == "asc")
                return "arrow-up";
            if (coldef.sortDirection == "desc")
                return "arrow-down";
            return "";
        };
        // check if there is a flex column and if there is it will assign the remainging width to the strech column (and returns that number)
        LightGridController.prototype.assignFlexibleColWidth = function () {
            var parentwidth = this.$el.width();
            var cd = undefined;
            var totalFixedColsWidth = 0;
            $.each(this.colDefinitions, function (index, coldef) {
                if (coldef.isFlexCol)
                    cd = coldef;
                else
                    totalFixedColsWidth += coldef.width;
            });
            // if no strechable column was found then stop here
            if (!cd)
                return -1;
            // if the difference between the parent width and the fixed cols is greater than '50' then set that width to the flex column.
            if (parentwidth - totalFixedColsWidth > 50) {
                cd.width = parentwidth - totalFixedColsWidth - 2; // take off two pixels re. the borders
                // if a scrollbar is shown then take off another 20 pixels 
                if (this.$datascrollable.hasScrollBar())
                    cd.width = cd.width - 20;
            }
            else
                cd.width = 50; // We don't want the flex column to be smaller than 50...
            // return the width we gave the flex column
            return cd.width;
        };
        // assign a flex column
        LightGridController.prototype.setFlexColumn = function (colName) {
            var coldefIn = this.getColDefinition(colName);
            $.each(this.colDefinitions, function (index, coldef) {
                if (coldefIn == coldef)
                    coldef.isFlexCol = true;
                else
                    coldef.isFlexCol = false;
            });
        };
        LightGridController.prototype.createHeader = function () {
            var self = this;
            var headerTemplate = "<div class='row-header flex-parent-row' > ";
            $.each(this.colDefinitions, function (index, coldef) {
                // define the css classes we apply to each header column
                var cssclasses = "cell-header cell-right-column ";
                cssclasses += coldef.classAlign + " ";
                if (coldef.isFlexCol)
                    cssclasses += "stretchable ";
                // get and lowercase the colName allowing us to get hold of the appropriate column when taking actions like sorting, resizing etc.
                var colName = coldef.colName.toLowerCase();
                var hitem = "";
                hitem += "<div class='" + cssclasses + "' data-sgcol='" + colName + "' style='width: " + coldef.width + "px;'>";
                hitem += "<span>" + coldef.colHeader + "</span>";
                hitem += "<span class='" + self.getSortSymbol(coldef) + "'></span>";
                if (coldef.isFlexCol)
                    hitem += "<i class='pull-right fa fa-arrows-h' style='background-color: transparent; color: rgb(201, 201, 208);' title='this column is flexible sized'></i>";
                hitem += "</div>";
                headerTemplate += hitem;
            });
            headerTemplate += "</div>";
            return headerTemplate;
        };
        LightGridController.prototype.createRows = function () {
            var self = this;
            var s = "";
            for (var i = 0; i < self.dataEngine.baseDataPrepared.length; i++) {
                var dataItem = self.dataEngine.baseDataPrepared[i];
                // start row definition
                s += "      <div class='row flex-parent-row' data-pkvalue='" + dataItem.pkvalue + "' >";
                // step through each ColDefinition
                self.colDefinitions.forEach(function (coldef) {
                    // retrieve the actual raw cell value
                    var myvalue = dataItem[coldef.colName];
                    // check if any custom formatting is required
                    myvalue = self.getFormattedValue(myvalue, dataItem, coldef);
                    // ask the client to fill in any generic styling properties
                    var styleProp = self.cbStyling(coldef, dataItem);
                    // start Cell definition
                    s += "<div class='cell cell-right-column " + (coldef.isFlexCol ? "stretchable" : "") + " " + coldef.classAlign + "' ";
                    s += "data-sgcol='" + coldef.colName + "' style='width: " + coldef.width + "px; ";
                    // if a cell backcolour was given then apply it
                    if (styleProp.cellBackColour)
                        s += " background-color: " + styleProp.cellBackColour + "; ";
                    // if a cell forecolour was given then apply it
                    if (styleProp.cellForeColour)
                        s += " color: " + styleProp.cellForeColour + "; ";
                    s += "'>";
                    // check if this cell is merged with an image and we were given an image
                    if (coldef.mergeWithImage && styleProp.imgName)
                        s += "<div class='merged-image " + coldef.colAlign + "' style='background-color: " + styleProp.imgBackColour + "; color: " + styleProp.imgForeColour + ";'> <i class='fa " + styleProp.imgName + "' > </i> </div>";
                    // if this is an image colum then just show the image
                    if (coldef.colType == "image") {
                        var faImage = styleProp.imgName;
                        if (faImage.length == 0)
                            faImage = myvalue; // if no return value was given then use the actual data
                        s += "<i class='fa " + faImage + "'\"></i>";
                    }
                    else
                        // simply write out the actual cell value
                        s += myvalue;
                    s += " </div>"; // end cell definition
                });
                s += "      </div>"; // end row definition
            }
            return s;
        };
        LightGridController.prototype.createGridStructure = function (showBorder) {
            var s = "";
            // --------------------
            // define the grid structure
            // --------------------
            var s = "";
            s += "<div class='grid-light flex-parent-col " + (showBorder ? "border" : "") + "' >";
            s += "  <div class='spinner' style='display: none'}> <div> <i class='fa fa-spinner fa-spin fa-3x'></i> </div> </div>";
            s += "  <div class='header-containment'> </div>";
            s += "  <div class='header' >";
            s += "      <div class='resize-marker' title='resize this column or double-click to make it the flex-column'> </div>";
            s += "      <div class='insert-marker'>";
            s += "          <i class='down fa fa-caret-down fa-2x'></i>";
            s += "      </div>";
            s += "      <div class='header-template' style='position: relative'> </div>";
            s += "  </div>";
            s += "  <div class='data-scrollable flex-child flex-scrollable' >";
            s += "      <div class='data'> </div>";
            s += "      <div class='full-resize-marker'> </div>";
            s += "  </div> ";
            s += "  " + this.createPager();
            s += "</div>";
            return s;
        };
        LightGridController.prototype.createPager = function () {
            var s = "";
            s += "      <div class='pager'>";
            s += "          <button type='button' class='btnFirstPage btn btn-default btn-xs pager-button'> <i class='fa fa-step-backward' title='First page'></i> </button> ";
            s += "          <button type='button' class='btnPrevPage btn btn-default btn-xs pager-button'> <i class='fa fa-caret-left fa-lg' title='Previous page'></i> </button> ";
            s += "          <span class='pager-text' style='margin: 0px 4px 0px 4px'></span>";
            s += "          <button type='button' class='btnNextPage btn btn-default btn-xs pager-button'> <i class='fa fa-caret-right fa-lg' title='Next page'></i> </button> ";
            s += "          <button type='button' class='btnLastPage btn btn-default btn-xs pager-button'> <i class='fa fa-step-forward' title='Last page'></i> </button> ";
            s += "          <span style='margin: 0px 2px 0px 20px'>page size: </span>";
            s += "          <select class=page-size title='Number of rows per page'></select>";
            return s;
        };
        LightGridController.prototype.getFormattedValue = function (theValue, dataItem, coldef) {
            // if a date field is given AND user gave a specific format then blindly format is as such and return
            if (coldef.colType.startsWith("date") && coldef.colFormat.length > 0) {
                return __de.getNiceDate(theValue, coldef.colFormat);
            }
            if (coldef.colType == "datetime")
                return __de.getNiceDateTime(theValue);
            if (coldef.colType == "date")
                return __de.getNiceDate(theValue);
            var isNumeric = coldef.colType == "number";
            if (!isNumeric)
                return theValue;
            var myformat = "";
            var currColumn = "";
            var currSymbol = "";
            if (coldef.colCurrLookup)
                currColumn = coldef.colCurrLookup.toLowerCase();
            if (currColumn.length > 0) {
                var currColValue = dataItem[currColumn];
                // ask the CurrencyManager for all details regarding this currency
                var currInfo = __cm.getCurrencyInfo(currColValue);
                // if we didn't get anything then we don't know....
                currSymbol = (currInfo == undefined ? "?" : currInfo.sign) + " ";
                myformat = currInfo == undefined ? "" : currInfo.format;
            }
            // if a colFormat was given then always override the possible returned currInfo.format...
            if (coldef.colFormat)
                myformat = coldef.colFormat;
            // define the return value
            return currSymbol + numeral(theValue).format(myformat);
        };
        return LightGridController;
    })();
    exports.LightGridController = LightGridController;
    // Defines all properties of a Data-Column 
    var ColDefinition = (function () {
        function ColDefinition(dbname, header, width, colType, format, align, sortDirection, currlookup, mergeWithImage) {
            this.colName = "";
            this.colHeader = "";
            this.colType = ""; // "string", "number", "datetime", "boolean", "image"
            this.hasImage = false; // if true it will combine the cell with an image
            this.colFormat = "";
            this.colAlign = "";
            this.colCurrLookup = "";
            this.sortDirection = "asc";
            this.width = 0;
            this.mergeWithImage = false; // if true then this column will be merged with an image the client can set
            this.classAlign = "";
            this.isFlexCol = false; // if true then this column will be stretched to fill empty col space
            this.colName = dbname.toLowerCase();
            this.colHeader = header;
            this.colType = colType || "string";
            this.colFormat = format || "";
            this.colAlign = align || "left";
            this.sortDirection = sortDirection || "";
            this.width = width || 120;
            this.colCurrLookup = currlookup || "";
            this.mergeWithImage = mergeWithImage || false;
            if (this.width == -1) {
                this.isFlexCol = true;
                this.width = 100;
            }
            if (align) {
                if (align === "right")
                    this.classAlign = "alignright";
                if (align === "center")
                    this.classAlign = "aligncenter";
            }
        }
        return ColDefinition;
    })();
    exports.ColDefinition = ColDefinition;
    // Contains any styling properties the client sets and are used when formatting each cell
    var CellStyleProperies = (function () {
        function CellStyleProperies() {
            this.cellBackColour = "";
            this.cellForeColour = "black";
            this.imgBackColour = "";
            this.imgForeColour = "black";
            this.imgName = "";
        }
        return CellStyleProperies;
    })();
    exports.CellStyleProperies = CellStyleProperies;
});
