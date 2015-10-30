
(function () {
    'use strict';
    define(['device'], function (device) {

        MenuController.$inject = ['$rootScope', '$scope', '$state', 'LocalStorageService', 'LoginService', 'LocalDBService', 'TranslatorService'];

        function MenuController($rootScope, $scope, $state,  LocalStorageService, loginService, localDBService, translatorService) {

        	$scope.deliveryType = 'Transport'
        	$scope.transportRoute = 'NA';
        	$scope.vehicle = 'NA';

            $scope.logout = function() {
	        	loginService.logout(DSV.driver)
	             .then(function(data) {
	            	 $.when(localDBService.init(DSV.constants.DSVDrivers, { searchFields: DSV.searchFields[DSV.constants.DSVDrivers] }))
	                 .then(function() {
                    	console.log('[MenuController] - deleting driver...');
                    	$.when(localDBService.removeCollection(DSV.constants.DSVDrivers))
                    	.then(function() {
                            device.removeBarcodeCallback();
                        	localDBService.closeAll();
                        	$scope._resetDriver();
 	                        $state.go('init.login');
                    	});
	                });
	             });
	            };

            $scope.goToRouteTransp = function(){
            	$state.go('init.route', {'checkScreen':  1});
            };

           	$scope._resetDriver = function(){
        		DSV.driver.username = '';
                DSV.driver.token = '';
                DSV.driver.expirationDate = 0;
                DSV.driver.vehicle = '';
                DSV.driver.isTransport = true;
                DSV.driver.transportRoute = '';
                DSV.driver.routeDate = '';
                DSV.driver.existsTransportRoute = false;
        	};

        	$rootScope.$on('languageChanged', function(event, messages) {
                if (messages == undefined)
                    messages = DSV.constants.messages;

                $scope.messages = messages;
        	});
        }

        return MenuController;
    })
})();
