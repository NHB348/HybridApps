(function () {
    'use strict';
    define([], function () {

    	StopDetailsTabsController.$inject = ['$rootScope', '$scope'];

        function StopDetailsTabsController($rootScope, $scope) {
        	$scope.$on('stopRetrieved', function(event, id) {
        		$scope.id = id;
        	});
        	$scope.$on('stopSignMode', function(event, mode) {
        		 $scope.signMode = mode;
        	});
        	
        	$scope.showSignMode = function(){
        	    if ($scope.signMode) {
        	    	return "ng-hide";
        	    } else {
        	    	return "ng-show";
        	    }
        	};
        }

        return StopDetailsTabsController;
    })
})();