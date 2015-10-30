(function () {
    'use strict';
    define([], function () {

        AddItemsToStopController.$inject = ['$rootScope', '$scope', '$state', '$stateParams', '$ionicLoading',
                                            'UtilsService'];

        function AddItemsToStopController($rootScope, $scope, $state, $stateParams, $ionicLoading,
                                            utilsService) {
            var SIZE = 5;

            $scope._init = function() {
                $scope.data = {};
                $scope.pager = {};
                $scope.items = [];
                $scope.currentItems = [];

                $scope.id = $stateParams.id;
                $scope.parentView = $stateParams.parentView;
                $scope.data = $stateParams.data;
            };

            $scope.$on('$ionicView.enter', function() {
                $scope.messages = DSV.constants.messages;
                $scope._init();

                $.when(utilsService.loadStopAsync($scope.id))
                .then(function(stop) {
                    $scope.stop = stop;
                    stop.shipment.g
                });
    		});

            $scope.goBack = function() {
                if (parentView == 'StopHandling') {
                    $state.go('stop-handling', { id: $scope.id });
                }
            };

            $scope.onAddScannedItem = function() {
                var newItem = {
                    code: $scope.data.itemCode,
                    isHandled: false,
                    isDeviated: false
                };
                $scope.data.itemCode = '';

                $scope.items.push(newItem);

                $scope.pager.endIndex = Math.min(SIZE, $scope.items.length);
                $scope.pager.count = $scope.items.length;
                $scope.currentItems = $scope.items.slice($scope.pager.startIndex, $scope.pager.endIndex + 1);
            };

            $scope.onHandleItem = function(item) {
                if (item.isHandled == true) {
                    item.isDeviated = false;
                    item.deviations = [];
                    item.reason = 'Handled without scanning';
                } else {
                    if (item.isDeviated == false) {
                        item.reason = '';
                    }
                }
            };

            $scope.onDeviateAll = function() {
                $.when(utilsService.saveStopAsync($scope.stop))
                .then(function() {
                    device.removeBarcodeCallback();
                    $state.go('stop-deviation', {id: $scope.stop.id, level: 'shipment', code: item.code, parentView: 'StopHandling' });
                });
            };

            $scope.onDeviateItem = function(item) {
                $.when(utilsService.saveStopAsync($scope.stop))
                .then(function() {
                    device.removeBarcodeCallback();
                    $state.go('stop-deviation', {id: $scope.stop.id, level: 'item', code: item.code, parentView: 'CreateStop' });
                });
            };
        }

        return AddItemsToStopController;
    })
})();
