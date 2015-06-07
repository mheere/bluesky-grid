//http://stackoverflow.com/questions/4814398/how-can-i-check-if-a-scrollbar-is-visible
jQuery.fn.hasScrollBar = function () {
    return this.get(0).scrollHeight > this.get(0).clientHeight;
};
String.prototype.lower = function () {
    return this.toLowerCase();
};
String.prototype.upper = function () {
    return this.toUpperCase();
};
String.prototype.contains = function (contains) {
    var me = this.lower();
    contains = contains.lower();
    return me.indexOf(contains) > -1;
};
String.prototype.startsWith = function (startsWith) {
    var me = this.lower();
    startsWith = startsWith.lower();
    return me.indexOf(startsWith) === 0;
};
String.prototype.endsWith = function (suffix) {
    var me = this.lower();
    suffix = suffix.lower();
    return me.indexOf(suffix, this.length - suffix.length) !== -1;
};
String.prototype.replaceAll = function (search, replace) {
    if (replace === undefined) {
        return this.toString();
    }
    return this.split(search).join(replace);
};
Array.prototype.removeAll = function (cb) {
    var x;
    for (var i = this.length - 1; i >= 0; i--) {
        x = this[i];
        if (cb(x)) {
            this.splice(i, 1);
        }
    }
};
Array.prototype.findAndRemove = function (cb) {
    var match = $.each(this, function (index, itemTemp) {
        return cb(itemTemp);
    });
    var index = this.indexOf(match);
    if (index > -1) {
        this.splice(index, 1);
    }
};
Array.prototype.findItem = function (cb) {
    var match;
    $.each(this, function (index, itemTemp) {
        var res = cb(itemTemp);
        if (res)
            match = itemTemp;
    });
    return match;
};
Array.prototype.hasItem = function (cb) {
    var match = $.each(this, function (index, itemTemp) {
        var res = cb(itemTemp);
        if (res)
            match = itemTemp;
    });
    return match ? true : false;
};
Array.prototype.hasItem2 = function (s) {
    var match = $.each(this, function (index, itemTemp) {
        return itemTemp == s;
    });
    return match ? true : false;
};
Array.prototype.remove = function (item) {
    var pos = this.indexOf(item);
    if (pos > -1)
        this.splice(pos, 1);
};
