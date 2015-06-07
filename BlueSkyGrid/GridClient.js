define(["require", "exports", './GridController', './SampleData', './CurrencyManager'], function (require, exports, __gc, __data, __cm) {
    // -------------------------------------------------------------------------------------
    // BlueSky Grid - TESTPAGE - full experimental grid
    // -------------------------------------------------------------------------------------
    var GridClient = (function () {
        function GridClient() {
            this._$comment = undefined;
        }
        GridClient.prototype.prepare = function () {
            // one-off, define some currencies for the CurrencyManager so it can return symbols for the grid
            __cm.setCurrencyInfo(new __cm.CurrencyInfo("GBP", "British Pound", "£", "GBP", ""));
            __cm.setCurrencyInfo(new __cm.CurrencyInfo("USD", "US Dollar", "$", "USD", ""));
            __cm.setCurrencyInfo(new __cm.CurrencyInfo("EUR", "Euro", "€", "EUR", ""));
            // define the column definitions for the grid
            this._coldefs = [];
            this._coldefs.push(new __gc.ColDefinition("code", "Code", 100, "", "", "", "asc"));
            this._coldefs.push(new __gc.ColDefinition("fullname", "Fullname", -1));
            this._coldefs.push(new __gc.ColDefinition("county", "County", 110, "", "", "", "", "", true));
            this._coldefs.push(new __gc.ColDefinition("currency", "Currency", 90, "", "", "center"));
            this._coldefs.push(new __gc.ColDefinition("valuation", "Valuation", 110, "number", "0,0.00", "right", "", "currency"));
            this._coldefs.push(new __gc.ColDefinition("price", "Price", 110, "number", "0,0.00", "right", "", "currency"));
            this._coldefs.push(new __gc.ColDefinition("myimage", "Img", 50, "image", "", "center"));
            this._coldefs.push(new __gc.ColDefinition("created", "Created", 150, "date", "", "center"));
        };
        // this call creates the grid and places it within the given DOM element
        GridClient.prototype.createGrid = function ($grid, $comment) {
            var self = this; // 
            // hand over the comment dom element (so we can write out comments);
            this._$comment = $comment;
            // create a grid light controller
            this._lg = new __gc.GridController();
            this._lg.createGrid($grid);
            // supply a callback to be informed when the user selects a row
            this._lg.cbSelectedDataItem = function (dataItem) {
                $comment.text("Row selected - single click - code: " + dataItem.code);
            };
            // supply a callback to be informed when the user double clicks a row
            this._lg.cbSelectedDataItemDblClick = function (dataItem) {
                $comment.text("Row selected - double click - code: " + dataItem.code);
            };
            this._lg.cbStyling = function (coldef, item) {
                // define a new CellStyleProperties object we will return
                var styleProp = new __gc.CellStyleProperies();
                // now check which column is being checked and set any style properties appropriately 
                if (coldef.colName == "county") {
                    if (item["county"] == "Kent" && Math.floor(item["price"]) % 2 == 0)
                        styleProp.cellBackColour = "rgb(178, 232, 178)";
                    if (Math.floor(item["price"]) % 4 == 0)
                        styleProp.imgBackColour = "rgb(255, 196, 8)";
                    if (item["county"] == "Sussex")
                        styleProp.imgForeColour = "red";
                }
                if (coldef.colName == "valuation") {
                    if (item["valuation"] < 200) {
                        styleProp.cellBackColour = "rgb(252, 88, 88)";
                        styleProp.cellForeColour = "white";
                    }
                    else
                        styleProp.cellForeColour = "green";
                }
                if (coldef.colName == "price" && item["valuation"] < 1000)
                    styleProp.cellForeColour = "red";
                if (coldef.colName == "myimage") {
                    if (item["price"] >= 250 && item["price"] < 500)
                        styleProp.cellForeColour = "red";
                    else if (item["price"] >= 500)
                        styleProp.cellForeColour = "rgb(249, 92, 241)";
                }
                // image
                if (coldef.colName == "myimage") {
                    if (item["price"] < 130)
                        styleProp.imgName = "fa-coffee";
                    else if (item["price"] < 250)
                        styleProp.imgName = "fa-floppy-o";
                    else if (item["price"] < 500)
                        styleProp.imgName = "fa-warning";
                }
                if (coldef.colName == "county") {
                    if (item["price"] < 100)
                        styleProp.imgName = "fa-coffee";
                    else if (item["price"] < 250)
                        styleProp.imgName = "fa-cube";
                    else if (item["price"] < 500)
                        styleProp.imgName = "fa-cog";
                }
                return styleProp;
            };
        };
        // (re)populate the data of the test grid
        GridClient.prototype.populateData = function (rowcount) {
            var self = this;
            // if no count was given the assign 500 rows
            if (!rowcount)
                rowcount = 500;
            // create some sample data
            var data = __data.generateSampleData(rowcount);
            // simply pass on the data (and their definitions) to the grid light 
            this._lg.setData(data, this._coldefs).done(function () {
                self._$comment.text("Grid loaded with " + rowcount + " rows."); // let user know
            });
        };
        return GridClient;
    })();
    exports.GridClient = GridClient;
});
