
export enum NavigationAction { "first", "prev", "next", "last", "none" }

// -----------------------------------------------------------------------------------------
// 
// -----------------------------------------------------------------------------------------
export class DataEngine {

    private _oldSort: string = "";              // hang on to the previous sort so we can compare

    private _sortColumn: string = "";           // 
    private _sortDirection: string = "";        // 

    private _currentPage = 1;                   // the current page 
    private _maxPages = 1;                      // the maximum number of pages (calculated)
    private _pageSize = 200;                    // initial page size

    private _baseDataRaw: any[] = [];           // all raw client side records
    private _baseDataPrepared: any[] = [];      // all prepared data

    get baseDataRaw(): any[] {
        return this._baseDataRaw;
    }
    get baseDataPrepared(): any[] {
        return this._baseDataPrepared;
    }

    get currentPage(): number {
        return this._currentPage;
    }
    get maxPages(): number {
        return this._maxPages;
    }
    get pageSize(): number {
        return this._pageSize;
    }

    get sortColumn(): string {
        return this._sortColumn;
    }
    set sortColumn(value: string) {
        this._sortColumn = value;
    }

    get sortDirection(): string {
        return this._sortDirection;
    }
    set sortDirection(value: string) {
        this._sortDirection = value;
    }

    constructor() { }

    // ----------------------------------
    // New fresh data is given
    // ----------------------------------
    public processData(data: any, sortColumn?: string, sortDirection?: string) {
        var self = this;
        
        // clear out all data we are holding
        this._baseDataRaw.length = 0;
        this._baseDataPrepared.length = 0;

        // hand over if given
        if (sortColumn) self.sortColumn = sortColumn;
        if (sortDirection) self.sortDirection = sortDirection;

        // step throuh all rows
        for (var i: number = 0; i < data.length; i++) {
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

    }

    public setPageSize(pagesize: number) {

        // set the new PageSize
        this._pageSize = pagesize;

        // how many pages should I have for the total data
        var count = this._baseDataRaw.length;

        // set the max page
        var i = Math.floor((count - 1) / this.pageSize);
        if (count == 0) i = 0;      // override i if given count was zero
        this._maxPages = i + 1;
        
        // protect going pass the maxPage
        if (this.currentPage > this.maxPages)
            this._currentPage = this.maxPages;

        // make sure we prepare new data (pretend we are on first page again)
        this.refresh(NavigationAction.first);
    }


    // -----------------------
    // reprocesses the data given any new instructions (like sort)
    // -----------------------
    public refresh(action: NavigationAction) {

        // check if navigation action needs to be taken
        if (action == NavigationAction.first) this._currentPage = 1;
        if (action == NavigationAction.prev && this._currentPage > 1) this._currentPage--;
        if (action == NavigationAction.next && this._currentPage < this.maxPages) this._currentPage++;
        if (action == NavigationAction.last) this._currentPage = this.maxPages;

        // check if sort has changed
        var sortChanged: boolean = (this.sortColumn + this.sortDirection) != this._oldSort;
        
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

    }

    // a simple sort on the original data
    private performEnumerableSort(enumerableObj: any, sortOnColumn: string, sortDirection: string) {
        // if need to do sorting then do so
        if (sortOnColumn.length > 0) {
            if (sortDirection == "asc")
                enumerableObj = enumerableObj.OrderBy("x=>x." + sortOnColumn);
            else
                enumerableObj = enumerableObj.OrderByDescending("x=>x." + sortOnColumn);
        }
        return enumerableObj;
    }
 
    // retrieves a dataItem (row) - there are cloned prior to returning as to never effect the original data
    public getDataItem(pkvalue: string): any {
        var row = this._baseDataRaw.findItem(function (item) { return item.pkvalue == pkvalue; });
        if (!row) return row;
        var clonedRow = jQuery.extend(true, {}, row);
        return clonedRow;
    }

}



export function propertiesToLower(obj) {
    var props: string[] = [];
    for (var prop in obj) {
        if (obj.hasOwnProperty(prop)) {
            props.push(prop);
        }
    }
    props.forEach(function (prop: string) {
        if (prop != prop.toLowerCase()) {
            obj[prop.toLowerCase()] = obj[prop];
            delete obj[prop];
        }
    });
}

export var formatDate: string = "DD MMM YYYY";
export var formatDateTime: string = "DD MMM YYYY, HH:mm:ss";

export function getNiceDate(date: any, format?: string) {
    var ret: string = "";
    try {
        format = (format && format.length > 0) ? format : formatDate;
        ret = moment(date).format(format);
    }
    catch (e) { ret = "error"; }
    return ret;
}

export function getNiceDateTime(date: any, format?: string) {
    var ret: string = "";
    try {
        format = (format && format.length > 0) ? format : formatDateTime;
        ret = moment(date).format(format);
    }
    catch (e) { ret = "error"; }
    return ret;
}

export function getDateTimeNow() {
    return getNiceDateTime(new Date());
}
