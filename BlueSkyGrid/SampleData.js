define(["require", "exports"], function (require, exports) {
    // Generated a bunch of sample data that can be used agains the ColDefinitions 
    function generateSampleData(numberOfRows) {
        var arrCounties = ["Kent", "Sussex", "Devon"];
        var arrImages = ["fa-taxi", "fa-cloud-download", "fa-bug", "fa-glass", "fa-bank", "fa-area-chart", "fa-arrow-up", "fa-arrow-down"];
        var arrCurrencies = ["USD", "GBP", "EUR"];
        // define the return data
        var data = [];
        for (var i = 0; i < numberOfRows; i++) {
            var row = {};
            row["code"] = "Code" + i;
            row["shortname"] = "SN" + i;
            row["fullname"] = "FullName" + i;
            row["firstname"] = "Marcel_" + i;
            row["updown"] = arrImages[getRndNumber(0, arrImages.length)];
            row["myimage"] = "fa-bar-chart";
            row["no_of_children"] = getRndNumber(0, 10);
            row["currency"] = arrCurrencies[getRndNumber(0, arrCurrencies.length)];
            row["price"] = (Math.random() * getRndNumber(0, 1000));
            row["county"] = arrCounties[getRndNumber(0, arrCounties.length)];
            row["valuation"] = Math.random() * getRndNumber(0, 50) * i;
            row["created"] = randomDate(new Date(2000, 1, 1), new Date());
            row["superwealthy"] = (getRndNumber(1, 3) == 1 ? "Y" : "N");
            row["checkbox"] = getRndNumber(1, 5);
            data.push(row);
        }
        return data;
    }
    exports.generateSampleData = generateSampleData;
    function randomDate(start, end) {
        return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    }
    function getRndNumber(min, max) {
        return Math.floor(Math.random() * (max - min) + min);
    }
});
