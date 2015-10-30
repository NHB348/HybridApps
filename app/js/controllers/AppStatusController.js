(function () {
    'use strict';
    define([], function () {

    	AppStatusController.$inject = ['$rootScope', '$scope', '$stateParams', '$state', '$ionicLoading', '$timeout',
                                         'UtilsService'];

        function AppStatusController($rootScope, $scope, $stateParams, $state, $ionicLoading, $timeout,
        								utilsService) {
        	$scope.connected = "Disconnected";
        	$scope.hours = 0;
        	
        	$scope.sentStops = 0;
        	$scope.totalSentStops = 0;
        	$scope.receivedStops = 0;
        	$scope.totalReceivedStops = 0;
        	
        	$scope.version = DSV.constants.version;
        	$scope.framework = DSV.constants.framework;
        	$scope.GSPCoords = "NOK.";
        	
    		$scope.loadStatus = function() {
    			var device = require('device'),
                    sync = require('sync');
                
                device.capturePosition(function(position) {
                    var heartBeatUrl = SERVER_ROOT + 'adapters/HeartBeatAdapter/v1/heartbeat';
                    heartBeatUrl += "/" + DSV.driver.vehicle;
                    heartBeatUrl += "/" + position.coords.latitude + '/' + position.coords.longitude;
                    
                    sync.isServerAvailable(heartBeatUrl, DSV.driver, function(isAvailable) {
                       if (isAvailable) {
                            $scope.connected = "Connected";
                            DSV.constants.lastConnectionTime = new Date();
                            $scope.hours = 0;
                        } else {
                            $scope.connected = "Disconnected";
                            var now = new Date();

                            if (DSV.constants.lastConnectionTime != null)
                                $scope.hours = Math.floor((now - DSV.constants.lastConnectionTime) / (1000*60*60));
                            else 
                                $scope.hours = "many";
                        }

                        var lat = $scope._convertDDtoDMS(position.coords.latitude, false);
                        var long = $scope._convertDDtoDMS(position.coords.longitude, true);
                        $scope.GSPCoords = "OK. " + lat.deg + "°" + lat.min + "'" + lat.sec + "\"" + lat.dir + " " +
                                            long.deg + "°" + long.min + "'" + long.sec + "\"" + long.dir;
                        
                        //$scope.$apply();
                    });
                }, function(err) {
                    console.warn('[AppStatusController] - No position:' + err);
                    
                    $scope.GSPCoords = "NOK.";
	    			//$scope.$apply();
                });
    		};
    		
    		$scope.$on('$ionicView.enter', function() {
    			$scope.messages = DSV.constants.messages;
                $scope.loadStatus();
    		});
        	
        	$scope.goBack = function() {
        		$state.go('stops.todo', { status: 'todo' });
        	};
        	
        	$scope._convertDDtoDMS = function(D, lng){
        	    return {
        	        dir : D<0?lng?'W':'S':lng?'E':'N',
        	        deg : 0|(D<0?D=-D:D),
        	        min : 0|D%1*60,
        	        sec :(0|D*60%1*6000)/100
        	    };
        	}
        };

        return AppStatusController;
    })
})();