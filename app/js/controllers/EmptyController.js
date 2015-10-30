(function () {
    'use strict';
    define([], function () {

        EmptyController.$inject = ['$rootScope', '$scope'];

        function EmptyController($rootScope, $scope) {

            $scope.$on('$ionicView.enter', function() {
                $scope.messages = DSV.constants.messages;
    			// on load
    		});
        }

        return EmptyController;
    })
})();