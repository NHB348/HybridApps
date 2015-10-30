(function () {
    'use strict';

    define(['sync'], function (sync) {

        StopDeviationsService.$inject = ['UtilsService'];

        function StopDeviationsService(utilsService) {
            this.getDeviations = function(driver) {
            	return sync.getDeviations(driver);
            };
            
            this.loadDeviations = function() {
                var dfd = $.Deferred();
        		
                $.when(utilsService.loadCollectionAsync(DSV.constants.DSVDeviations))
                .then(function(results) {
                    dfd.resolve(results);   
                });
                
                return dfd.promise();
            }
        }
        return StopDeviationsService;
    });
})();