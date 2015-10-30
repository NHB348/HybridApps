(function () {
    'use strict';

    define([], function () {

        EmptyService.$inject = [];

        function EmptyService() {
        	this.testFunction = function() {
                
            };
            
            this.testFunctionAsync = function() { // call with $.when(service.testFunctionAsync()).then(function() { });
                var dfd = $.Deferred();
                
                // dfd.resolve();
                
                return dfd.
            };
            
        }
        return EmptyService;
    });
})();