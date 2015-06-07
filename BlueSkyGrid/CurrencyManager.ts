// ----------------------------------------------------------------
// Provides a fast lookup of the sign for a given currency code.
// ----------------------------------------------------------------
var currencies: any = [];      // hangs on to all CurrencyInfo objects

// accepts new CurrencyInfo objects
export function setCurrencyInfo(cinfo: CurrencyInfo) {
    return currencies[cinfo.code] = cinfo;
}

// public expose fast retrieval given a code to its CurrencyInfo object
export function getCurrencyInfo(code: string): CurrencyInfo {
    if (currencies.hasOwnProperty(code))
        return currencies[code];
    return undefined;
}

// Identifies a single CurrencyInfo
export class CurrencyInfo {

    constructor(public code: string,
        public fullName: string,
        public sign: string,
        public shortName: string,
        public format: string) {
    }

}

