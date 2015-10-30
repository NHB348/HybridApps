(function () {
    'use strict';
    define(['device'], function (device) {

        MoveShipmentsController.$inject = ['$rootScope', '$scope', '$state', '$stateParams', '$ionicLoading', '$ionicModal', '$timeout',
                                          'UtilsService', 'TranslatorService'];

        function MoveShipmentsController($rootScope, $scope, $state, $stateParams, $ionicLoading, $ionicModal, $timeout,
                                         utilsService, translatorService) {

            $scope.$on('$ionicView.enter', function() {
                $scope.messages = DSV.constants.messages;
                $scope.selectedShipments = [];

                if ($stateParams.id && $stateParams.id != "") {
                    $scope.id = $stateParams.id;
                }
                if ($stateParams.parentView && $stateParams.parentView != "") {
                    $scope.parentView = $stateParams.parentView;
                }

    			var dfd = $.Deferred();
                $scope._initPopups();
	    		console.log('[StopHandlingController] - Loading stop...');
	    		$ionicLoading.show({
            		template: 'Loading... Please wait!'
            	});

                $.when(utilsService.loadStopAsync($scope.id))
                .then(function(stop) {
                    console.log('[StopHandlingController] - Stop found!');
                    $scope.stop = stop;

                    $ionicLoading.hide();
                    dfd.resolve();
                })
                .fail(function() {
                    $scope.goBack();
                    dfd.reject();
                });

                dfd.promise();
    		});

            $scope.goBack = function() {
                if ($scope.parentView == 'StopHandling')
        		  $state.go('stop-handling', { id: $scope.id });

                if ($scope.parentView == 'Stops')
        		  $state.go('stops.todo', { status: 'todo' });

                $scope.parentView = undefined;
        	};

            $scope.onAccept = function() {
                $scope.parentView = undefined;
                $scope.shipmentMovePopup.show();
            };

            $scope.onSelectGroup = function(group) {
                if (group.selected == undefined)
                    group.selected = true;
                else
                    group.selected = !group.selected;

                $scope._updateSelectedShipments(group.name, group.selected);
            };

            $scope.onMoveShipments = function(moveAction) {
                switch(moveAction) {
                    case "new":
                        $scope.shipmentMovePopup.hide();
                        device.removeBarcodeCallback();
                        $state.go("create-stop", {
                             parentId: $scope.stop.id,
                             parentView: "MoveShipments",
                             data: $scope.selectedShipments.join('|')
                         });

                        break;
                    case "existing":
                        $scope.shipmentMovePopup.hide();
                        $state.go("stops.todo", {
                            status: "todo",
                            selectedStopId: $scope.stop.id,
                            operation: 'split',
                            data: $scope.selectedShipments.join("|")
                        });
                        break;
                    case "cancel":
                        $scope.shipmentMovePopup.hide();
                        break;
                }
            };

            $scope._updateSelectedShipments = function(name, add) {
                var idx = -1;
                $.each($scope.selectedShipments, function(i, groupName) {
                    if (name == groupName)
                        idx = i;
                });

                if (add) {
                    if (idx == -1) { // not found
                        $scope.selectedShipments.push(name);
                    }
                } else {
                    if (idx > -1) { // found
                        $scope.selectedShipments.splice(idx, 1);
                    }
                }
            };

            $scope._initPopups = function() {
                $ionicModal.fromTemplateUrl('templates/StopPopups/shipmentMovePopup.html', {
                    scope: $scope
                }).then(function(modal) {
                    $scope.shipmentMovePopup = modal;
                });
            };
        }

        return MoveShipmentsController;
    })
})();
