(function () {
    'use strict';

    define(['sync'], function (sync) {

        StopsService.$inject = [];

        function StopsService() {
        	this.stops = null;
        	
            this.getStops = function(forced) {
                var dfd = $.Deferred();

                if (this.stops != null && !forced) {
                     dfd.resolve(this.stops);
                     return dfd.promise();
                }
                
                var self = this;
                
                $.when(sync.getStops(DSV.driver, forced))
                .then(function(stops) {
                    self.stops = stops;
                    dfd.resolve(stops);
                })
                .fail(function(err) {
                    dfd.reject(err);
                });
                
                return dfd.promise();
            };
        }
        return StopsService;
    });
})();