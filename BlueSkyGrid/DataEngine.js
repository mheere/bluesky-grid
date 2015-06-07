define(["require", "exports"], function (require, exports) {
    (function (NavigationAction) {
        NavigationAction[NavigationAction["first"] = 0] = "first";
        NavigationAction[NavigationAction["prev"] = 1] = "prev";
        NavigationAction[NavigationAction["next"] = 2] = "next";
        NavigationAction[NavigationAction["last"] = 3] = "last";
        NavigationAction[NavigationAction["none"] = 4] = "none";
    })(exports.NavigationAction || (exports.NavigationAction = {}));
    var NavigationAction = exports.NavigationAction;
    // -----------------------------------------------------------------------------------------
    // 
    // -----------------------------------------------------------------------------------------
    var DataEngine = (function () {
        function DataEngine() {
            this._oldSort = ""; // hang on to the previous sort so we can compare
            this._sortColumn = ""; // 
            this._sortDirection = ""; // 
            this._currentPage = 1; // the current page 
            this._maxPages = 1; // the maximum number of pages (calculated)
            this._pageSize = 200; // initial page size
            this._baseDataRaw = []; // all raw client side records
            this._baseDataPrepared = []; // all prepared data
        }
        Object.defineProperty(DataEngine.prototype, "baseDataRaw", {
            get: function () {
                return this._baseDataRaw;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DataEngine.prototype, "baseDataPrepared", {
            get: function () {
                return this._baseDataPrepared;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DataEngine.prototype, "currentPage", {
            get: function () {
                return this._currentPage;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DataEngine.prototype, "maxPages", {
            get: function () {
                return this._maxPages;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DataEngine.prototype, "pageSize", {
            get: function () {
                return this._pageSize;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DataEngine.prototype, "sortColumn", {
            get: function () {
                return this._sortColumn;
            },
            set: function (value) {
                this._sortColumn = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DataEngine.prototype, "sortDirection", {
            get: function () {
                return this._sortDirection;
            },
            set: function (value) {
                this._sortDirection = value;
            },
            enumerable: true,
            configurable: true
        });
        // ----------------------------------
        // New fresh data is given
        // ----------------------------------
        DataEngine.prototype.processData = function (data, sortColumn, sortDirection) {
            var self = this;
            // clear out all data we are holding
            this._baseDataRaw.length = 0;
            this._baseDataPrepared.length = 0;
            // hand over if given
            if (sortColumn)
                self.sortColumn = sortColumn;
            if (sortDirection)
                self.sortDirection = sortDirection;
            for (var i = 0; i < data.length; i++) {
                // get hold of the row
                var item = data[i];
                // ensure that each row for this grid has a pkvalue property which is an internally used unique row id
                if (!item.hasOwnProperty('pkvalue'))
                    item.pkvalue = i;
                // convert all properties to be lowercase 
                propertiesToLower(item);
                // add the prepared row to our internal base array of raw data
                self._baseDataRaw.push(item);
            }
            // work out page info
            this.setPageSize(this.pageSize);
        };
        DataEngine.prototype.setPageSize = function (pagesize) {
            // set the new PageSize
            this._pageSize = pagesize;
            // how many pages should I have for the total data
            var count = this._baseDataRaw.length;
            // set the max page
            var i = Math.floor((count - 1) / this.pageSize);
            if (count == 0)
                i = 0; // override i if given count was zero
            this._maxPages = i + 1;
            // protect going pass the maxPage
            if (this.currentPage > this.maxPages)
                this._currentPage = this.maxPages;
            // make sure we prepare new data (pretend we are on first page again)
            this.refresh(0 /* first */);
        };
        // -----------------------
        // reprocesses the data given any new instructions (like sort)
        // -----------------------
        DataEngine.prototype.refresh = function (action) {
            // check if navigation action needs to be taken
            if (action == 0 /* first */)
                this._currentPage = 1;
            if (action == 1 /* prev */ && this._currentPage > 1)
                this._currentPage--;
            if (action == 2 /* next */ && this._currentPage < this.maxPages)
                this._currentPage++;
            if (action == 3 /* last */)
                this._currentPage = this.maxPages;
            // check if sort has changed
            var sortChanged = (this.sortColumn + this.sortDirection) != this._oldSort;
            // hang on to the current position
            this._oldSort = this.sortColumn + this.sortDirection;
            // create enumerable of the raw data
            var enumerableGroup = Enumerable.From(this._baseDataRaw);
            // if there is a sorting to take place then do so
            if (this.sortColumn.length > 0) {
                enumerableGroup = this.performEnumerableSort(enumerableGroup, this.sortColumn, this.sortDirection);
                this._baseDataPrepared = enumerableGroup.ToArray();
            }
            else
                this._baseDataPrepared = enumerableGroup.ToArray();
            // cut off rows we don't need
            var startrow = (this.currentPage - 1) * this.pageSize;
            var endrow = startrow + (this.pageSize <= this._baseDataPrepared.length ? this.pageSize : this._baseDataPrepared.length);
            this._baseDataPrepared = this._baseDataPrepared.slice(startrow, endrow);
        };
        // a simple sort on the original data
        DataEngine.prototype.performEnumerableSort = function (enumerableObj, sortOnColumn, sortDirection) {
            // if need to do sorting then do so
            if (sortOnColumn.length > 0) {
                if (sortDirection == "asc")
                    enumerableObj = enumerableObj.OrderBy("x=>x." + sortOnColumn);
                else
                    enumerableObj = enumerableObj.OrderByDescending("x=>x." + sortOnColumn);
            }
            return enumerableObj;
        };
        // retrieves a dataItem (row) - there are cloned prior to returning as to never effect the original data
        DataEngine.prototype.getDataItem = function (pkvalue) {
            var row = this._baseDataRaw.findItem(function (item) {
                return item.pkvalue == pkvalue;
            });
            if (!row)
                return row;
            var clonedRow = jQuery.extend(true, {}, row);
            return clonedRow;
        };
        return DataEngine;
    })();
    exports.DataEngine = DataEngine;
    function propertiesToLower(obj) {
        var props = [];
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop)) {
                props.push(prop);
            }
        }
        props.forEach(function (prop) {
            if (prop != prop.toLowerCase()) {
                obj[prop.toLowerCase()] = obj[prop];
                delete obj[prop];
            }
        });
    }
    exports.propertiesToLower = propertiesToLower;
    exports.formatDate = "DD MMM YYYY";
    exports.formatDateTime = "DD MMM YYYY, HH:mm:ss";
    function getNiceDate(date, format) {
        var ret = "";
        try {
            format = (format && format.length > 0) ? format : exports.formatDate;
            ret = moment(date).format(format);
        }
        catch (e) {
            ret = "error";
        }
        return ret;
    }
    exports.getNiceDate = getNiceDate;
    function getNiceDateTime(date, format) {
        var ret = "";
        try {
            format = (format && format.length > 0) ? format : exports.formatDateTime;
            ret = moment(date).format(format);
        }
        catch (e) {
            ret = "error";
        }
        return ret;
    }
    exports.getNiceDateTime = getNiceDateTime;
    function getDateTimeNow() {
        return getNiceDateTime(new Date());
    }
    exports.getDateTimeNow = getDateTimeNow;
});
