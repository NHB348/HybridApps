(function () {
    'use strict';
    define(['device', 'lodash'], function (device, _) {

        CreateStopController.$inject = ['$rootScope', '$scope', '$state', '$stateParams', '$ionicLoading', '$ionicModal', '$timeout',
                                        'UtilsService', 'StopDeviationsService'];

        function CreateStopController($rootScope, $scope, $state, $stateParams, $ionicLoading, $ionicModal, $timeout,
                                        utilsService, deviationsService) {

            var SIZE = 5;

            $scope._init = function() {
                var dfd = $.Deferred();
                $scope.pager = {};
                $scope.items = [];
                $scope.currentItems = [];
                $scope.type = 0;

                $scope.siteId = '';
                $scope.shipmentReference = '';
                $scope.scanModalData = {};
                $scope.scanModalData.data = '';

                if ($scope.id == undefined || $scope.id == '') { // there's no id, so create an empty stop
                    $scope.title = $scope.messages.newStop;
                    var groups = [{
                        name: 'Unallocated items',
                        type: 1,
                        items: [],
                        services: [],
                        weight: {
                            value: 0,
                            unit: 'kg'
                        },
                        volume: {
                            value: 0,
                            unit: 'm3'
                        },
                        comment: ''
                    }];

                    $scope.stop = {
                        id: '_' + utilsService.createGuid(),
                        name: 'New stop ' + device.getTime(),
                        status: 'todo',
                        shipment: {
                            groups: groups
                        },
                        loadSequence: 0
                    };
                    dfd.resolve();
                } else { // load stop for adding: operation = add
                    $scope.title = $scope.messages.addItems;
                    $.when(utilsService.loadStopAsync($scope.id))
                    .then(function(stop) {
                        $scope.stop = stop;
                        $scope.__initialStop = _.cloneDeep(stop);
                        dfd.resolve();
                    });
                }

                return dfd.promise();
            };

            $scope.$on('$ionicView.enter', function() {
                $scope.messages = DSV.constants.messages;
                $scope.data = {};
    			$scope._initState();
                $scope._initPopups();
                $ionicLoading.show({
            		template: 'Loading... Please wait!'
            	});
                $.when($scope._init())
                .then(function() {
                    $scope._buildItems();
                    $ionicLoading.hide();
                });

                try {
                    device.addBarcodeCallback(function(data) {
                        $scope._handleScannedData(data);
                    });
                } catch (e) {
                    console.error('Error on barcode scan callback: ' + e);
                }
    		});

            $scope.goBack = function() {
                if ($scope.items.length > 0 || $scope.shipmentReference != '' || $scope.siteId != '') {
                    $scope.confirmationModal.show();
                } else {
                    device.removeBarcodeCallback();
                    $scope.simpleToastData = {};
                    $scope.simpleToastData.text = $scope.messages.stopAborted;

                    if ($scope.parentView == "Stops")
                        $state.go('stops.todo', { status: 'todo' });
                    if ($scope.parentView == 'StopHandling')
                        $state.go('stop-handling', { id: $scope.id });
                    if ($scope.parentView == 'StopsInbox')
                        $state.go('stops-inbox');
                    if ($scope.parentView == 'MoveShipments')
                        $state.go('stop-move-shipments', { id: $scope.parentId });

                    $scope._openToast();
                }
        	};

            $scope.onConfirmCancel = function(confirm) {
                if (confirm == false) {
                    $scope.confirmationModal.hide();
                } else {
                    $ionicLoading.show({
                        template: 'Loading... Please wait!'
                    });
                    $scope.simpleToastData = {};
                    $scope.simpleToastData.text = $scope.messages.stopAborted;

                    if ($scope.id == undefined) {
                        // revert any changes for create
                        $.when(utilsService.removeStopAsync($scope.stop.id))
                        .then(function() {
                            device.removeBarcodeCallback();
                            $ionicLoading.hide();

                            if ($scope.parentView == 'MoveShipments')
                                $state.go('stop-move-shipments', { id: $scope.parentId });
                            if ($scope.parentView == 'StopsInbox')
                                $state.go('stops-inbox');
                            else
                                $state.go('stops.todo', { status: 'todo' });

                            $scope.parentView = undefined;
                            $scope._openToast();
                        });
                    } else { // add
                        // revert any changes for add
                        $.when(utilsService.saveStopAsync($scope.__initialStop))
                        .then(function() {
                            $ionicLoading.hide();

                            if ($scope.parentView == 'StopHandling') {
                                $state.go('stop-handling', { id: $scope.id });
                            } else {
                                $state.go('stops.todo', { status: 'todo' });
                            }

                            $scope.parentView = undefined;
                            $scope._openToast();
                        })
                    }
                }
            }

            $scope.onCreateStop = function() {
                if ($scope.type == 0) {
                    $scope.simpleToastData.text = $scope.messages.noStopType;
                    $scope._openToast();
                    return;
                }

                if ($scope.items.length == 0) {
                    $scope.simpleToastData.text = $scope.messages.noItems;
                    $scope._openToast();
                    return;
                }

                $scope.parentView = undefined;

                if ($scope.parentId != undefined) { // we came from move shipments to new stop
                    $ionicLoading.show({
                        template: 'Loading... Please wait!'
                    });

                    $scope.stop.parentId = $scope.parentId;
                    var selectedShipments = $scope.data.data.split('|');

                    $.when(utilsService.loadStopAsync($scope.parentId))
                    .then(function() {
                        $.each(selectedShipments, function(i, name) {
                            var groups = parentStop.shipment.groups;
                            for (var j = groups.length - 1; j >= 0; --j) {
                                var group = groups[j];
                                if (group.name == name) {
                                    $scope.stop.shipment.groups.push(group);
                                    parentStop.shipment.groups.splice(j, 1);
                                }
                            }
                        });

                        parentStop.isSplited = true;
                        // save & refresh
                        $.when(utilsService.saveStopAsync(parentStop))
                        .then(function() {
                            $.when(utilsService.saveStopAsync($scope.stop))
                            .then(function() {
                                $scope.simpleToastData = {};
                                $scope.simpleToastData.text =
                                    $scope.messages.movedShipments
                                    .replace("__COUNT__", selectedShipments.length)
                                    .replace("__NAME__", stop.name);

                                $ionicLoading.hide();

                                $state.go("stops.todo", { status: "todo" });
                                $scope._openToast();
                            })
                            .fail(function() {
                                $ionicLoading.hide();
                            });
                        })
                        .fail(function() {
                            $ionicLoading.hide();
                        });
                    });
                } else { // create stop or add items to a stop
                    if ($scope.id != undefined) { // if add items,
                        var areItemsHandled = $scope._areItemsHandled();
                        if (areItemsHandled == true) {
                            $.when(utilsService.saveStopAsync($scope.stop))
                            .then(function() {
                                device.removeBarcodeCallback();
                                $state.go('stops.todo', { status : 'todo' });
                            });
                        } else { // we are creating stop => sign it
                            $scope.stopPodCheckHandledModal.show();
                        }
                    } else { // sign stop
                        $scope._signStop();
                    }
                }
            };

            $scope.onShipmentSiteSelected = function(selection) {
                $scope.siteShipmentSelection = selection;
                if ($scope.siteShipmentSelection == 'shipment')
                    $scope.shipmentSiteScanPopupTitle = $scope.messages.scanEnterShipmentId;
                if ($scope.siteShipmentSelection == 'site')
                    $scope.shipmentSiteScanPopupTitle = $scope.messages.scanEnterSiteId;

                if ($scope.shipmentSiteScanPopup)
                    $scope.shipmentSiteScanPopup.show();
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

            $scope.onAddShipmentOrSite = function() {
                if ($scope.addShipmentSitePopup)
                    $scope.addShipmentSitePopup.show();
            };

            $scope.onAcceptShipmentSite = function() {
                if ($scope.siteShipmentSelection == 'shipment')
                    $scope.stop.shipmentReference  = $scope.scanModalData.data;
                if ($scope.siteShipmentSelection == 'site')
                    $scope.stop.siteId  = $scope.scanModalData.data;

                $scope.onCancelSiteShipment();
            };

            $scope.onCancelSiteShipment = function() {
                if ($scope.addShipmentSitePopup)
                    $scope.addShipmentSitePopup.hide();
                if ($scope.shipmentSiteScanPopup)
                    $scope.shipmentSiteScanPopup.hide();
            };

            $scope.onSelectStopType = function() {
                if ($scope.stopTypePopup)
                    $scope.stopTypePopup.show();
            };

            $scope.onStopTypeSelected = function(type) {
                $scope.stop.shipment.groups[0].type = type;
                $scope.stopTypePopup.hide();
            };

            $scope.scanBarcode = function() {
                try {
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

            $scope.takeDeviationPhoto = function(item) {
                if (item.isDeviated == false)
                    return;

                device.removeBarcodeCallback();
                $state.go('stop-deviation-photo', { id: $scope.stop.id, code: item.code, parentView: 'CreateStop' });
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

            // pager actions
            $scope.onNext = function() {
                $scope.currentItems = [].concat(utilsService.getCollectionBatch($scope.pageSize, $scope.pager, $scope.items));
            };

            $scope.onPrev = function() {
                $scope.currentItems = [].concat(utilsService.getCollectionBatch(-$scope.pageSize, $scope.pager, $scope.items));
            };

            $scope._initState = function() {
                if ($stateParams.id != undefined)
                    $scope.id = $stateParams.id;

                if ($stateParams.parentView != undefined)
                    $scope.parentView = $stateParams.parentView;

                if ($stateParams.parentId != undefined)
                    $scope.parentId = $stateParams.parentId;

                if ($stateParams.data != undefined) {
                    if ($scope.parentId == undefined) // it not form move shipments to new/create stop
                        $scope.data.itemCode = $stateParams.data;
                    else
                        $scope.data.data = $stateParams.data;
                }
            };

            $scope._buildItems = function() {
                if ($scope.stop.shipment.groups.length == 1)
                    $scope.items = $scope.stop.shipment.groups[0].items;
                else {
                    var groups = $scope.stop.shipment.groups;
                    var unallocatedGroup = utilsService.findUnallocatedGroup(groups);
                    if (unallocatedGroup != null) {
                        $scope.items = unallocatedGroup.items;
                    }
                }
                $scope.pager.startIndex = 0;
                $scope.pager.endIndex = Math.min(SIZE, $scope.items.length);
                $scope.pager.count = $scope.items.length;
                $scope.currentItems = $scope.items.slice($scope.pager.startIndex, $scope.pager.endIndex + 1);

                $.each($scope.items, function(i, item) {
                    item.reason = item.isHandled == true ? item.reason :
                        (item.isDeviated == true ?
                         (item.deviations && item.deviations.length > 0 ? item.deviations[0].description : '') : '');
                });
            };

            $scope._initPopups = function() {
                $ionicModal.fromTemplateUrl('templates/NewStop/stopTypePopup.html', {
                    scope: $scope
                }).then(function(modal) {
                    $scope.stopTypePopup = modal;
                });
                $ionicModal.fromTemplateUrl('templates/StopPopups/simpleToast.html', {
                    scope: $scope
                }).then(function(modal) {
                    $scope.simpleToast = modal;
                });
                $ionicModal.fromTemplateUrl('templates/NewStop/addShipmentSitePopup.html', {
                    scope: $scope
                }).then(function(modal) {
                    $scope.addShipmentSitePopup = modal;
                });
                $ionicModal.fromTemplateUrl('templates/NewStop/shipmentSiteScanPopup.html', {
                    scope: $scope
                }).then(function(modal) {
                    $scope.shipmentSiteScanPopup = modal;
                });
                $ionicModal.fromTemplateUrl('templates/NewStop/confirmationModal.html', {
                    scope: $scope
                }).then(function(modal) {
                    $scope.confirmationModal = modal;
                });
                $ionicModal.fromTemplateUrl('templates/StopPopups/stopPodCheckHandled.html', {
                    scope: $scope,
                    id: 'stopPodCheckHandled'
                }).then(function(modal) {
                    $scope.stopPodCheckHandledModal = modal;
                });
            };

            $scope._openToast = function() {
                $.when(utilsService.openToast($scope.simpleToast))
                .then(function() {
                    $timeout(function() {
                        utilsService.closeToast($scope.simpleToast);
                    }, DSV.constants.toastTimeout);
                });
            };

            $scope._areItemsHandled = function() {
                if ($scope.items.length <= 0)
                    false;

                for (var i = 0; i < $scope.items.length; ++i) {
                    var item = $scope.items[i];

                    if (item.isHandled == false || item.isDeviated == false)
                        return false;
                }

                return true;
            };

            $scope.onDeviateUnhandled = function() {
                $.when(deviationsService.loadDeviations())
                .then(function(deviations) {
                    $.each($scope.stop.shipment.groups, function(i, group) {
                        var deviation = utilsService.getDeviation(deviations, group.type, 'M');

                        if (deviation == null) {
                            console.warn('[CreateStopController] - deviateUnhandled - deviation is missing');
                            alert('No missing deviation!');
                            return;
                        };

                        deviation.kind = $scope.messages.deviations[deviation.type];
                        deviation.description = $scope.messages.deviations[deviation.value];

                        $.each($scope.items, function(i, item) {
                            if (!item  || item.isDeviated || item.isHandled)
                                return;

                            item.deviations = [].concat(deviation);
                            item.isDeviated = true;
                        });
                    });

                    $scope._signStop();
                });
            };

            $scope.closePodCheckModal = function() {
                $scope.stopPodCheckHandledModal.hide();
            };

            $scope._signStop = function() {
                $.when(utilsService.saveStopAsync($scope.stop))
                .then(function() {
                    device.removeBarcodeCallback();
                    $state.go('signStop', { id: $scope.stop.id });
                });
            };
        }

        return CreateStopController;
    })
})();
