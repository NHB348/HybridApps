(function () {
    'use strict';

    define(['sync'], function (sync) {

        StopsInboxService.$inject = ['UtilsService'];

        function StopsInboxService(utilsService) {

            this.loadNewStopsAsync = function() { // call with $.when(service.testFunctionAsync()).then(function() { });
                return utilsService.loadCollectionAsync(DSV.constants.DSVNewStops);
            };

            this.importStopsAsync = function(stops) {
                var dfd = $.Deferred();
                var self = this;

                $.when(utilsService.saveCollectionAsync(DSV.constants.DSVStops, stops)) // save to Stops
                .then(function() {
                    $.when(utilsService.removeCollectionAsync(DSV.constants.DSVNewStops, stops)) // remove from NewStops
                    .then(function() {
                        dfd.resolve();
                    })
                    .fail(function(err) {
                        dfd.reject(err);
                    });
                })
                .fail(function(err) {
                    dfd.reject(err);
                });

                return dfd.promise();
            };

            this.searchStopsByItem = function(itemCode) {
                var dfd = $.Deferred();
                var self = this;
                var driver = DSV.driver;

                //var url = SERVER_ROOT + 'adapters/StopsAdapter/v1/stop/byitem/' + itemCode;
                var url = 'data/searchStops.json';

                $.ajax({
                    type: "GET",
                    contentType: "application/json",
                    dataType: "json",
                    timeout: 20000,
                    async: true,
                    cache: false,
                    url: url,
                    beforeSend: function(xhr) {
                        xhr.setRequestHeader("Authorization", "Basic " + btoa(driver.username + ":" + driver.token));
                    }
                })
                .done(function(data) {
                    var stops = data.stops.filter(function(stop) {
                        var found = false;
                        $.each(stop.shipment.groups, function(i, group) {
                            $.each(group.items, function(j, item) {
                                if (item.code == itemCode)
                                    found = true;
                            })
                        });

                        return found;
                    });

                    dfd.resolve(stops);
                })
                .fail(function(xhr, textStatus) {
                    var text = "HTTP Error: " + xhr.status + "(" + textStatus + ")";
                    console.error('[StopsInboxService/searchStopsByItem] - ' + text);
                    //$logger.log('Error on checkCredentials: ' + text);
                    dfd.reject({message: text, code: xhr.status});
                });

                return dfd.promise();
            };

            this.syncTransportData = function() {
                return sync.syncTransportData();
            };
        }
        return StopsInboxService;
    });
})();
