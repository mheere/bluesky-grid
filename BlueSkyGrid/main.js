define(function (require) {
    $(document).ready(function () {
        // require the GridClient module (which mimicks a normal client page)
        var __lg2 = require('GridClient');
        // find the element we will place the grid in
        var $grid = $('.mygrid');
        // find the element we will place any (grid) debug-comments in
        var $comment = $('.comment-text');
        //  create a new instance of the DEMO grid class which explains how to setup the light grid 
        var newGrid = new __lg2.GridClient();
        // prepare some data
        newGrid.prepare();
        // disable the apply button until grid is created
        $("#apply").attr('disabled', 'disabled');
        // act on user clicking createGrid button
        $('#btnCreateGrid').click(function () {
            // remove the create grid button
            $('#btnCreateGrid').remove();
            // enable the apply button
            $("#apply").removeAttr("disabled");
            // and tell it to create a grid inside the designated element
            newGrid.createGrid($grid, $comment);
            // find the element we will place any (grid) debug-comments in
            var rowcount = $('.rowcount').val();
            // repopulate the data
            newGrid.populateData(rowcount);
        });
        // now listen for Apply button clicks
        $('#apply').click(function () {
            // find the element we will place any (grid) debug-comments in
            var rowcount = $('.rowcount').val();
            // sanity check
            if (rowcount < 0 || rowcount > 50000) {
                // something is wrong so reset it back to 1000 rows!
                $('.rowcount').val("1000");
                // reset the number of rows to 1000 and inform the user with a red-ish banner
                rowcount = 1000;
                $comment.text("please select a number of rows below 50000 (and over zero)");
                $comment.css('background-color', "rgb(253, 175, 175)");
                // start a 3 seconds wait then re-popuplate
                setTimeout(function () {
                    $comment.css('background-color', "");
                    newGrid.populateData(rowcount);
                }, 3000);
                return;
            }
            // repopulate the data
            newGrid.populateData(rowcount);
        });
    });
});
