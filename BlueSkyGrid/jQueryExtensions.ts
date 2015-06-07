// let $ know there is more to it
interface JQuery {
    hasScrollBar(): boolean;
}  

//http://stackoverflow.com/questions/4814398/how-can-i-check-if-a-scrollbar-is-visible
jQuery.fn.hasScrollBar = function () {
    return this.get(0).scrollHeight > this.get(0).clientHeight;
}

// -----------------------------  interface String   ---------

interface String {
    replaceAll(search: string, replace: string): string;
    contains(string): boolean;
    startsWith(string): boolean;
    endsWith(string): boolean;
    lower(): string;
    upper(): string;
}

String.prototype.lower = function () {
    return this.toLowerCase();
};

String.prototype.upper = function () {
    return this.toUpperCase();
};

String.prototype.contains = function (contains) {
    var me: string = this.lower();
    contains = contains.lower();
    return me.indexOf(contains) > -1;
};

String.prototype.startsWith = function (startsWith) {
    var me: string = this.lower();
    startsWith = startsWith.lower();
    return me.indexOf(startsWith) === 0;
};

String.prototype.endsWith = function (suffix) {
    var me: string = this.lower();
    suffix = suffix.lower();
    return me.indexOf(suffix, this.length - suffix.length) !== -1;
};

String.prototype.replaceAll = function (search, replace) {
    if (replace === undefined) {
        return this.toString();
    }
    return this.split(search).join(replace);
};


// -----------------------------  interface Array<T>   ---------

interface Array<T> {
    removeAll(cb: (item) => boolean);
    findAndRemove(cb: (item) => boolean);
    findItem(cb: (item) => boolean): T;
    hasItem(cb: (item) => boolean): boolean;
    hasItem2(string): boolean;
    remove(item: T);
}

Array.prototype.removeAll = function (cb: (item) => boolean) {
    var x: any;
    for (var i = this.length - 1; i >= 0; i--) {
        x = this[i];
        if (cb(x)) {
            this.splice(i, 1);
        }
    }
};

Array.prototype.findAndRemove = function (cb: (item) => boolean) {
    var match = $.each(this, function (index, itemTemp) {
        return cb(itemTemp);
    });
    var index = this.indexOf(match);
    if (index > -1) {
        this.splice(index, 1);
    }
};

Array.prototype.findItem = function (cb: (item) => boolean) {
    var match;
    $.each(this, function (index, itemTemp) {
        var res = cb(itemTemp);
        if (res)
            match = itemTemp;
    });
    return match
};

Array.prototype.hasItem = function (cb: (item) => boolean) {
    var match = $.each(this, function (index, itemTemp) {
        var res = cb(itemTemp);
        if (res)
            match = itemTemp;
    });
    return match ? true : false;
};

Array.prototype.hasItem2 = function (s: string) {
    var match = $.each(this, function (index, itemTemp) {
        return itemTemp == s;
    });
    return match ? true : false;
};

Array.prototype.remove = function (item: any) {
    var pos: number = this.indexOf(item);
    if (pos > -1)
        this.splice(pos, 1);
};
 


