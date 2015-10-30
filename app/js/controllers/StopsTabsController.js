(function () {
    'use strict';
    define([], function () {

        StopsTabsController.$inject = ['$rootScope', '$scope', 'UtilsService'];

        function StopsTabsController($rootScope, $scope, utilsService) {
        	$scope.isSelectionMode = false;
        	$scope.$on('stopsRetrieved', function(event, stops) {
        		var s1 = utilsService.getStopsByStatus(stops, 'todo', function(stop) {
        			return stop.isConsolidated == undefined || stop.isConsolidated == false;
        		});
        		$scope.todoCount = s1.length;
        		var s2 = utilsService.getStopsByStatus(stops, 'done', function(stop) {
        			return stop.isConsolidated == undefined || stop.isConsolidated == false;
        		});
        		$scope.doneCount = s2.length;
        	});
        	
        	$scope.$on('selectionModeChanged', function(isSelectionMode) {
        		$scope.isSelectionMode = isSelectionMode;
        	});
            
            $scope.$on('$ionicView.enter', function() {
                $scope.messages = DSV.constants.messages;
            });
        }

        return StopsTabsController;
    })
})();