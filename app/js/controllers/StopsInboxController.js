(function () {
    'use strict';
    define(['device'], function (device) {

        StopsInboxController.$inject = ['$rootScope', '$scope', '$ionicLoading', '$state', '$stateParams', '$ionicModal', '$timeout',
                                       'UtilsService', 'StopsInboxService', 'TranslatorService'];

        function StopsInboxController($rootScope, $scope, $ionicLoading, $state, $stateParams, $ionicModal, $timeout,
                                      utilsService, stopsInboxService, translatorService) {

            $scope.stops = [];
            $scope.currentStops = [];
            $scope.pager = {};
            $scope.pager.startIndex = 0;
            $scope.pager.endIndex = 0;
            $scope.pager.count = 0;
            $scope.hasSelectedStops = false;
            $scope.data = {};
            $scope.data.itemCode = '';
            $scope.withSearch = false;

            var SIZE = DSV.constants.stopsListPageSize;

            $scope.$on('$ionicView.enter', function() {
                $scope.messages = DSV.constants.messages;

                if ($stateParams.withSearch) {
                    $scope.withSearch = $stateParams.withSearch === 'true';
                }

                try {
                    device.addBarcodeCallback(function(data) {
                        $scope._handleScannedData(data);
                    });
                } catch (e) {
                    console.error('Error on barcode scan callback: ' + e);
                }

                $scope._initPopups();
    			$scope._loadNewStops();
    		});

            $scope.onOK = function() { // accept all selected stops + delete them from NewStops list
                var stops = $scope.stops.filter(function(stop) {
                    return stop.toBeImported == true
                });

                if (stops.length == 0) {
                    $scope.goBack();
                    return;
                }

                $.each(stops, function(i, stop) {
                    if (stop.toBeImported)
                        delete stop.toBeImported;
                });

                $ionicLoading.show({
            		template: 'Loading... Please wait!'
            	});
                $.when(stopsInboxService.importStopsAsync(stops))
                .then(function() {
                    $ionicLoading.hide();
                    $scope.goBack();
                })
                .fail(function(err) {
                    $ionicLoading.hide();
                    console.error('[StopsInboxController/onOK] - Error: ' + err);
                    alert('Import error');
                });
            };

            $scope.goBack = function() {
                device.removeBarcodeCallback();
                $state.go('stops.todo', {status:'todo'});
            };

            $scope.onStopSelected = function(stopId) {
                $scope.hasSelectedStops = false;

                $.each($scope.stops, function(i, stop) {
                    if (stop.toBeImported == undefined)
                        return;

                    $scope.hasSelectedStops =
                        $scope.hasSelectedStops || stop.toBeImported;
                })
            };

            $scope.onSelectOption = function(option) {
                if ($scope.shipmentNotFoundPopup)
                    $scope.shipmentNotFoundPopup.hide();

                if (option == "new") {
                    device.removeBarcodeCallback();
                    $state.go('create-stop', { data: $scope.data.itemCode, parentView: 'StopsInbox' });
                }

                if (option == "existing") {
                    device.removeBarcodeCallback();
                    $state.go("stops.todo", { status: "todo", operation: "appendTo", data: $scope.data.itemCode });
                }
            };

            $scope._loadNewStops = function() {
                var dfd = $.Deferred();

                $ionicLoading.show({
            		template: 'Loading... Please wait!'
            	});

                $.when(stopsInboxService.loadNewStopsAsync())
                .then(function(stops) {
                    $scope.stops = stops;
                    $scope._resetStops();

                    $ionicLoading.hide();
                    dfd.resolve();
                })
                .fail(function() {
                    $ionicLoading.hide();
                    dfd.reject();
                });

                return dfd.promise();
            };

            $scope.onNext = function() {
                $scope.currentStops = utilsService.getCollectionBatch(SIZE, $scope.pager, $scope.stops);
            };

            $scope.onPrev = function() {
                $scope.currentStops = utilsService.getCollectionBatch(-SIZE, $scope.pager, $scope.stops);
            };

            $scope._computeTotalNumberOfItems = function(groups) {
            	return utilsService.computeTotalNumberOfItems(groups);
            };

            $scope.scanBarcode = function() {
                try {
					var device = require('device');
					var onSuccess = function(data) {
						$scope._handleScannedData(data);
						device.stopScanBarcode();
					};
					var onFailure = function(e) {
						alert(e);
					};
					var options = {};
					device.scanBarcode(onSuccess, onFailure, options);
				} catch (e) {
					console.error('Error @ scanBarcode: ' + JSON.stringify(e));
				}
            };

            $scope.onGetScannedItem = function() {
                if ($scope.data.itemCode == '') {
                    $scope.simpleToastData = {};
                    $scope.simpleToastData.text = 'No item code';
                    $.when(utilsService.openToast($scope.simpleToast))
                    .then(function(){
                        $timeout(function() { utilsService.closeToast($scope.simpleToast); }, DSV.constants.toastTimeout);
                    });
                    return;
                }

                if (device.isOnline() == false) {
                    $scope.simpleToastData = {};
                    $scope.simpleToastData.text = 'You are offline';
                    $.when(utilsService.openToast($scope.simpleToast))
                    .then(function(){
                        $timeout(function() { utilsService.closeToast($scope.simpleToast); }, DSV.constants.toastTimeout);
                    });
                    return;
                }

                $ionicLoading.show({
            		template: 'Searching... Please wait!'
            	});

                $.when(stopsInboxService.searchStopsByItem($scope.data.itemCode))
                .then(function(stops) {
                    if (stops.length == 0) { // code not found
                        $ionicLoading.hide();
                        if ($scope.shipmentNotFoundPopup)
                            $scope.shipmentNotFoundPopup.show();
                    } else {
                        $scope.data.itemCode = '';
                        $.each(stops, function(i, stop) {
                            stop.toBeImported = true;
                            $scope.stops.push(stop);
                        });

                        $scope.hasSelectedStops = true;
                        $scope.simpleToastData = {};
                        $scope.simpleToastData.text = stops.length + ' new stop(s) retrieved.';

                        $.when(utilsService.openToast($scope.simpleToast))
                        .then(function(){
                            $timeout(function() { utilsService.closeToast($scope.simpleToast); }, DSV.constants.toastTimeout);
                        });

                        $scope._resetStops();
                        $ionicLoading.hide();
                    }
                })
                .fail(function(err) {
                    $scope.data.itemCode = '';
                    $ionicLoading.hide();
                });
            };

            $scope.onRefresh = function() {
                $ionicLoading.show({
            		template: 'Loading... Please wait!'
            	});

                $.when(stopsInboxService.syncTransportData())
                .then(function() {
                    $scope._loadNewStops();
                    $ionicLoading.hide();
                })
                .fail(function() {
                    $ionicLoading.hide();
                });
            };

            $scope._handleScannedData = function(data) {
                if (data == undefined || data == null)
                    return;

                var text = data.barcode || data.text;
                console.log("Barcode found: " + text);
                if (text != undefined) {
                    $scope.data.itemCode = text;
                }
            };

            $scope._initPopups = function() {
                $ionicModal.fromTemplateUrl('templates/StopPopups/simpleToast.html', {
                    scope: $scope
                }).then(function(modal) {
                    $scope.simpleToast = modal;
                });
                $ionicModal.fromTemplateUrl('templates/StopPopups/shipmentNotFoundPopup.html', {
                    scope: $scope
                }).then(function(modal) {
                    $scope.shipmentNotFoundPopup = modal;
                });
            };

            $scope._resetStops = function() {
                // create mvvm for stop
                $.each($scope.stops, function(i, stop) {
                    stop.mvvm = {};
                    stop.mvvm.services = [];
                    stop.mvvm.services = utilsService.mergeServices(stop.shipment.groups);
                });

                $scope.pager.startIndex = 0;
                $scope.pager.endIndex = Math.min(SIZE, $scope.stops.length);
                $scope.pager.count = $scope.stops.length;
                $scope.currentStops = $scope.stops.slice($scope.pager.startIndex, $scope.pager.endIndex + 1);
            };

            $scope._computeTotalWeight = function(stop) {
                return utilsService.computeTotalWeight(stop);
            };

            $scope._isDelivery = function(stop) {
                return utilsService.isDelivery(stop);
            };

            $scope._isPickup = function(stop) {
                return utilsService.isPickup(stop);
            };
        }

        return StopsInboxController;
    })
})();
