define(["require", "exports"], function (require, exports) {
    // ----------------------------------------------------------------
    // Provides a fast lookup of the sign for a given currency code.
    // ----------------------------------------------------------------
    var currencies = []; // hangs on to all CurrencyInfo objects
    // accepts new CurrencyInfo objects
    function setCurrencyInfo(cinfo) {
        return currencies[cinfo.code] = cinfo;
    }
    exports.setCurrencyInfo = setCurrencyInfo;
    // public expose fast retrieval given a code to its CurrencyInfo object
    function getCurrencyInfo(code) {
        if (currencies.hasOwnProperty(code))
            return currencies[code];
        return undefined;
    }
    exports.getCurrencyInfo = getCurrencyInfo;
    // Identifies a single CurrencyInfo
    var CurrencyInfo = (function () {
        function CurrencyInfo(code, fullName, sign, shortName, format) {
            this.code = code;
            this.fullName = fullName;
            this.sign = sign;
            this.shortName = shortName;
            this.format = format;
        }
        return CurrencyInfo;
    })();
    exports.CurrencyInfo = CurrencyInfo;
});
