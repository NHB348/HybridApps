(function () {
    'use strict';
    define(['device'], function (device) {

    	StopHandlingController.$inject = ['$rootScope', '$scope', '$stateParams', '$ionicLoading', '$state', '$ionicModal', '$ionicPopover', '$timeout',
    	                                  'UtilsService', 'AppSettingsService', 'TranslatorService', 'StopDeviationsService'];

        function StopHandlingController($rootScope, $scope, $stateParams, $ionicLoading, $state, $ionicModal, $ionicPopover, $timeout,
        								utilsService, settingsService, translatorService, deviationsService) {

            var SIZE = DSV.constants.groupItemCountPerPage;
            var toastTimer = null;
        	$scope.pager = {};
            $scope.pager.startIndex = 0;
            $scope.currentItems = [];
            $scope.pager.showNumbers = false;
            $scope.isSiteIdValid = false;
        	$scope.areAllHandled = false;
            $scope.scanModalData = {};
            $scope.scanModalData.siteIdBarcode = '';
            $scope.showCustomerIdMenuItem = true;

        	$scope.loadStopAsync = function() {
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

                    if (DSV.constants.__localStop == null) // keep a cached version in case of canceling
                        DSV.constants.__localStop = stop;

                    $scope.createExtendedServices($scope.stop);

                    // Update pagination according to the length of the service panel
                    $scope.pageSize = SIZE - utilsService.objectLength($scope.extendedServices);

                    $scope._buildGroups($scope.stop);

                    var item1Click = parseInt(settingsService.getSettingValueByKey("10300"));
                    $scope.showAcceptAll = $scope._computeTotalNumberOfItems($scope.stop.shipment.groups) >= item1Click;
                    $scope._checkAllItems();

                    // $scope.handleScannedItem('00357065931232152124'); // do not leave it activated
                    //  uncomment below to check redirect on scanning same item twice
                    // setTimeout(function(){
                    //     $scope.handleScannedItem('00357065931232152124');
                    // }, 1500);

                    $scope.openScanIdModal();

                    $ionicLoading.hide();

                    if ($scope.photoCanceled == "true") {
                        $scope.simpleToastData = {};
                        $scope.simpleToastData.text = $scope.messages.deviationPhotosNotSaved;
                        $.when(utilsService.openToast($scope.simpleToast))
                        .then(function(){
                            $timeout(function() { utilsService.closeToast($scope.simpleToast); }, DSV.constants.toastTimeout);
                        });
                    }

                    dfd.resolve();
                })
                .fail(function(err) {
                    console.error('[StopHandlingController] - ' + err);
	                $scope.goBack('todo');
                	$ionicLoading.hide();
	                dfd.reject();
                });

				return dfd.promise();
			};

            $scope.$on("$ionicView.enter", function () {
            	$scope.messages = DSV.constants.messages;

                if ($stateParams.id && $stateParams.id != "") {
                    $scope.id = $stateParams.id;
                    $scope.photoCanceled = $stateParams.photoCanceled;
                }

                $scope.loadStopAsync();

                // add barcode callback for hardware button scanning
    			try {
    				device.addBarcodeCallback(function(data) {
                        var text = data.barcode || data.text;
    					$scope.handleScannedItem(text);
    				});
    			} catch (e) {
    				console.error('Error on barcode scan callback: ' + e);
    			}
            });

        	$scope.goBack = function(stopStatus) {
                device.removeBarcodeCallback();
        		$state.go('stops.' + stopStatus, {status : stopStatus});
        	};

            // paget actions
            $scope.onNext = function() {
                $scope.currentItems = [].concat(utilsService.getCollectionBatch($scope.pageSize, $scope.pager, $scope.items));
            };

            $scope.onPrev = function() {
                $scope.currentItems = [].concat(utilsService.getCollectionBatch(-$scope.pageSize, $scope.pager, $scope.items));
            };

            $scope.openScanIdModal = function() {
                if ($scope.stop.siteId && $scope.stop.enteredSiteId &&
                   $scope.stop.siteId == $scope.stop.enteredSiteId) {
                    $scope.isSiteIdValid = true;
                    return;
                } else {
                    $scope.isSiteIdValid = false;
                }

                if ($scope.stop.siteId == undefined)
                    return;

                if ($scope.siteIdModal) {
                    $scope.siteIdModal.$el.addClass('clearOverlay');
                    $scope.siteIdModal.show();
                }
            };

            $scope.openScanIdScanModal = function() {
            	if ($scope.siteIdScanModal) {
            		$scope.siteIdScanModal.show();
            	}
            };

            $scope.onSaveHandling = function() {
	    		$scope._mapItemsToStopItems();
                $scope._mapServicesToStopServices();
                $scope._checkAllItems();
                // enable the modal chain
                $scope.stopModalChain = false;

                if ($scope.extendedServices.cash != undefined && !$scope.extendedServices.cash.isHandled)
                    $scope.openPodCheckModal('cash');
                else if ($scope.extendedServices.pallet != undefined && !$scope.extendedServices.pallet.isHandled)
                    $scope.openPodCheckModal('pallet');
                else
                    $scope._checkHandledItems();
            };

            $scope.onCancelHandling = function(status) {
                var dfd = $.Deferred();

                /* in case of back = cancel modifications
                if (DSV.constants.__localStop != null) {
                    console.log('[StopHandlingController] - Saving stop...');
                    $ionicLoading.show({
                        template: 'Canceling... Please wait!'
                    });

                    // save locally
                    $.when(utilsService.saveStopAsync(DSV.constants.__localStop))
                    .then(function() {
                        DSV.constants.__localStop = null; // reset local cache
                        $scope.goBack(status);
                        $ionicLoading.hide();
                        dfd.resolve();
                    });
                } else {
                    dfd.resolve();
                    $scope.goBack(status);
                }*/
				$scope.goBack(status);
				return dfd.promise();
            };

        	$scope.onDeviateAll = function() {
                $scope._mapItemsToStopItems();

				// save locally
				$.when(utilsService.saveStopAsync($scope.stop))
                .then(function() {
                    device.removeBarcodeCallback();
                    $state.go('stop-deviation', {id: $scope.id, level: 'stop', parentView: 'StopHandling' });
                });
        	};

        	$scope.onHandleItem = function(item, handledBy) {
                handledBy = typeof handledBy == 'undefined' ? 'manually' : handledBy;

        		if (item.isHandled == true) {
        			item.isDeviated = false;
                    item.deviations = [];

                    if (handledBy == 'manually') {
                        item.reason = 'Handled without scanning';
                    }

                    $scope._unhandledItemsToast(item.code);
        		} else {
                    if (item.isDeviated == false) {
                        item.reason = '';
                    }
                }

                $scope._checkAllItems();

                $scope._mapItemsToStopItems();
                utilsService.saveStopAsync($scope.stop);
        	};

            $scope.onHandleService = function() {
                $scope._mapServicesToStopServices();
                utilsService.saveStopAsync($scope.stop);
            };

            $scope.podCheckAction = function(service, value) {
                if ($scope.extendedServices == undefined || $scope.extendedServices[service] == undefined)
                    return;

                var serv = $scope.extendedServices[service];

                if (value == 'back') {
                    // stop showing next modal if "back" is clicked
                    $scope.stopModalChain = true;
                } else {
                    // update the service with the clicked value
                    serv.isHandled = value;
                    $scope.onHandleService();
                }

                $scope.closePodCheckModal(serv.type);
            };

            $scope.createExtendedServices = function(stop) {
                var codService = utilsService.getStopService(stop, 'COD');
                var receiveService = utilsService.getStopService(stop, 'receivePallet');
                var leaveService = utilsService.getStopService(stop, 'leavePallet');
                var mergedServices = utilsService.mergeServices(stop.shipment.groups);

                $.each(mergedServices, function(i, service) {
                    if (service.uivalue == undefined || service.uivalue == '') {
                        service.uivalue = service.value + ' ' + (service.unit || '');
                    }
                });

                if (codService != undefined || receiveService != undefined || leaveService != undefined)
                    $scope.extendedServices = {};
                else
                    return;

                if (codService) {
                    var uivalue = $scope.messages.cashCollectValue.replace(
                        '__UIVALUE__',
                        utilsService.getService(mergedServices, 'COD').uivalue
                    );

                    $scope.extendedServices.cash = {
                        type: 'cash',
                        uivalue: uivalue,
                        isHandled: codService.isHandled || false
                    };
                }

                if (receiveService != undefined || leaveService != undefined) {
                    var uivalue = '';

                    if (receiveService != undefined)
                        uivalue += $scope.messages.palletExchangeReceive.replace(
                            '__UIVALUE__',
                            utilsService.getService(mergedServices, 'receivePallet').uivalue
                        );

                    if (leaveService != undefined)
                        uivalue += $scope.messages.palletExchangeLeave.replace(
                            '__UIVALUE__',
                            utilsService.getService(mergedServices, 'leavePallet').uivalue
                        );

                    var isHandledPallet = receiveService != null ? receiveService.isHandled : null ||
                                   leaveService != null ? leaveService.isHandled : null;

                    $scope.extendedServices.pallet = {
                        type: 'pallet',
                        uivalue: uivalue,
                        isHandled: isHandledPallet || false
                    };
                }
            };

        	$scope.onDeviateItem = function(item) {
                item.isDeviated = !item.isDeviated;
                $scope._mapItemsToStopItems();

                $.when(utilsService.saveStopAsync($scope.stop))
                .then(function() {
                    device.removeBarcodeCallback();
                    if (item.isHeader)
                        $state.go('stop-deviation', {id: $scope.id, level: 'shipment', code: item.code, parentView: 'StopHandling' });
                    else
                        $state.go('stop-deviation', {id: $scope.id, level: 'item', code: item.code, parentView: 'StopHandling' });
                });
        	};

        	$scope.scanSiteIdBarcode = function() {
        		try {
					var onSuccess = function(data) {
						var text = data.barcode || data.text;
						if (text != undefined) {
							console.log("[StopHandingController] - Barcode found: " + text);
							$scope.scanModalData.siteIdBarcode = text;

							if (!utilsService.validateSiteIdBarcode(text)) {
                                $scope.siteIdError = $scope.messages.invalidSiteIdError;
							} else {
                                if ($scope.stop.siteId != $scope.scanModalData.siteIdBarcode) {
                                    $scope.siteIdError = $scope.messages.siteIdsDoNotMatch;
                                    return;
                                }
								$scope.isSiteIdValid = true;
								$scope.stop.enteredSiteId = text;
								$scope.cancelScanId();
							}
						}
						device.stopScanBarcode();
					};
					var onFailure = function(e) {
						$scope.siteIdError = $scope.messages.genericBarcodeError;
					};
					var options = {};
					device.scanBarcode(onSuccess, onFailure, options);
				} catch (e) {
					console.error('[StopHandingController] - Error @ scanBarcode: ' + JSON.stringify(e));
				}
        	};

            $scope.cancelScanId = function() {
                if ($scope.siteIdScanModal)
                    $scope.siteIdScanModal.hide();

                if ($scope.siteIdModal)
                    $scope.siteIdModal.hide().then(function() {
                        $scope.siteIdModal.$el.removeClass('clearOverlay');
                        $scope.siteIdModal.remove();
                    });
            };

            $scope.openPodCheckModal = function(modalType) {
                modalType = modalType.toLowerCase();

                if (modalType == 'cash' && $scope.stopPodCheckCashModal != undefined)
                    $scope.stopPodCheckCashModal.show();

                if (modalType == 'pallet' && $scope.stopPodCheckPalletModal != undefined)
                    $scope.stopPodCheckPalletModal.show();

                if (modalType == 'unhandled' && $scope.stopPodCheckHandledModal != undefined)
                    $scope.stopPodCheckHandledModal.show();
            };

            $scope.closePodCheckModal = function(modalType) {
                modalType = modalType.toLowerCase();

                if (modalType == 'cash' && $scope.stopPodCheckCashModal != undefined)
                    $scope.stopPodCheckCashModal.hide();

                if (modalType == 'pallet' && $scope.stopPodCheckPalletModal != undefined)
                    $scope.stopPodCheckPalletModal.hide();

                if (modalType == 'unhandled' && $scope.stopPodCheckHandledModal != undefined)
                    $scope.stopPodCheckHandledModal.hide();
            };

            $scope.onHandleAllManually = function() {
                var dfd = $.Deferred();
                $scope.areAllHandled = true;

                $.each($scope.items, function(i, item) {
                    if (item.isHandled == false && item.isDeviated == false) {
                        item.isHandled = true;
                        item.reason = 'Handled without scanning';
                    }
        		});
                dfd.resolve();

                return dfd.promise();
            };

            // TODO : add audio feedback (MPPA 69 specs)
            $scope.handleScannedItem = function(itemCode) {
                $.when(utilsService.findItemInStopAsync(itemCode))
                .then(function(stop) {
                    if (stop && stop.id == $scope.stop.id) {
                        $.when(utilsService.saveStopAsync(stop))
                        .then(function(){
                            var item = utilsService.getItemsBy($scope.items, 'code', itemCode);
                            if(!item.isHandled) {
                                $scope.onHandleItem(item, 'device');
                            } else {
                                device.removeBarcodeCallback();
                                $state.go('stop-deviation', {id: $scope.id, level: 'item', code: itemCode, parentView: 'StopHandling' });
                            }
                        });
                    } else {
                        $scope.unknown = {};
                        $scope.unknown.code = itemCode;
                        if (stop && stop.id !== $scope.stop.id) {
                            // The item is not in the current stop
                            $scope.unknown.title = 'Item exists in transport';
                            $scope.unknown.type = 'stop';
                            $scope.unknown.stop = stop;
                        } else {
                            // The item is not in the current transport
                            $scope.unknown.title = 'Item not on transport';
                            $scope.unknown.type = 'transport';
                        }

                        $scope.openUnknownStopModal();
                    }
                })
                .fail(function(err) {
                    console.error('[Checking if it is unknow item] - ' + err);
                });
            };

            $scope.handleMethod = function(action) { // TODO: refactor/rename
                // Switch between types : stop/transfer
                switch(action){
                    case 'add-to-current-stop' :

                    break;

                    case 'move-to-existing-stop' :

                    break;

                    default :
                        //Ignore
                        $scope.closeUnknowStopModal();
                    break;
                }
            }

            $scope.checkSiteId = function() {
                if ($scope.scanModalData.siteIdBarcode == '' || $scope.scanModalData.siteIdBarcode == undefined) {
                    $scope.siteIdError = '';
                    return;
                }

                if (!utilsService.validateSiteIdBarcode($scope.scanModalData.siteIdBarcode)) {
                    $scope.siteIdError = $scope.messages.invalidSiteIdError;
                } else {
                    if ($scope.stop.siteId != $scope.scanModalData.siteIdBarcode) {
                        $scope.siteIdError = $scope.messages.siteIdsDoNotMatch;
                        return;
                    }
                    $scope.isSiteIdValid = true;
                    $scope.stop.enteredSiteId = $scope.scanModalData.siteIdBarcode;
                    $scope.cancelScanId();
                }
            };

            // Be sure that all modal are removed from dom after changing the sotp
            $scope.$on('$stateChangeStart', function(){
                if ($scope.siteIdModal)
                    $scope.siteIdModal.remove();
            });

            $scope.takeDeviationPhoto = function(item) {
                if (item.isHeader || item.isDeviated == false)
                    return;

                device.removeBarcodeCallback();
                $state.go('stop-deviation-photo', { id: $scope.stop.id, code: item.code, parentView: 'StopHandling' });
            };

            $scope._initPopups = function() {
            	$ionicPopover.fromTemplateUrl('templates/StopPopups/stopHandlingMenu.html',{
            		scope: $scope})
            	.then(function(popover) {
            		$scope.handlingMenu = popover;
            	});

                $ionicModal.fromTemplateUrl('templates/StopHandling/siteIdModal.html', {
                    id : 'siteIdModal',
                    scope: $scope
                }).then(function(modal) {
                    $scope.siteIdModal = modal;
                });
                $ionicModal.fromTemplateUrl('templates/StopHandling/siteIdModalScan.html', {
                    scope: $scope
                }).then(function(modal) {
                    $scope.siteIdScanModal = modal;
                });
                $ionicModal.fromTemplateUrl('templates/StopPopups/stopModalUnknown.html', {
                    scope: $scope
                }).then(function(modal) {
                    $scope.unknownStopModal = modal;
                });
                $ionicModal.fromTemplateUrl('templates/StopPopups/stopPodCheckCash.html', {
                    scope: $scope,
                    id: 'stopPodCheckCash'
                }).then(function(modal) {
                    $scope.stopPodCheckCashModal = modal;
                });
                $ionicModal.fromTemplateUrl('templates/StopPopups/stopPodCheckPallet.html', {
                    scope: $scope,
                    id: 'stopPodCheckPallet'
                }).then(function(modal) {
                    $scope.stopPodCheckPalletModal = modal;
                });
                $ionicModal.fromTemplateUrl('templates/StopPopups/stopPodCheckHandled.html', {
                    scope: $scope,
                    id: 'stopPodCheckHandled'
                }).then(function(modal) {
                    $scope.stopPodCheckHandledModal = modal;
                });
                $ionicModal.fromTemplateUrl('templates/StopPopups/stopsToast.html', {
                    scope: $scope
                }).then(function(modal) {
                    $scope.handledToast = modal;
                });
                $ionicModal.fromTemplateUrl('templates/StopPopups/simpleToast.html', {
                    scope: $scope
                }).then(function(modal) {
                    $scope.simpleToast = modal;
                });
            };

            $scope._unhandledItemsToast = function(itemCode) {
                if ($scope.handledToast == undefined)
                    return;

                $scope.toastData = {};
                $scope.toastData.found = true;
                $scope.toastData.code = itemCode;
                $scope.toastData.text = $scope.messages.handledItemsToast.replace(
                    '__ITEMSLEFT__',
                    utilsService.computeUnhandledItems($scope.items)
                );


                if($scope.handledToast._isShown) {
                    $timeout.cancel(toastTimer);
                }

                $timeout(function() { utilsService.closeToast($scope.simpleToast); }, DSV.constants.toastTimeout);

                $.when(utilsService.openToast($scope.handledToast))
                .then(function(){
                    toastTimer = $timeout(function(){ utilsService.closeToast($scope.handledToast)}, DSV.constants.toastTimeout);
                });
            };

            $scope._mapItemsToStopItems = function() {
                // map values from viewModel to model
				$.each($scope.items, function(index, item) {
					if (item.isHeader)
						return; // skip headers - not very interesting

					var stopItem = utilsService.findItemByCode($scope.stop, item.code);

					if (stopItem) {
						stopItem.isHandled = item.isHandled;
                        stopItem.isDeviated = item.isDeviated;
                        if (item.reason)
                            stopItem.reason = item.reason;
                        stopItem.deviations = item.deviations;
					}
				});
            };

            $scope._mapServicesToStopServices = function() {
                $.each($scope.extendedServices, function(index, service) {
                    if (service.type == 'pallet') {
                        var receiveService = utilsService.getStopService($scope.stop, 'receivePallet');
                        var leaveService = utilsService.getStopService($scope.stop, 'leavePallet');

                        if (receiveService) {
                            receiveService.isHandled = service.isHandled;
                        }
                        if (leaveService) {
                            leaveService.isHandled = service.isHandled;
                        }
                    } else {
                        var stopService = utilsService.getStopService($scope.stop, service.type);

                        if (stopService) {
                            stopService.isHandled = service.isHandled;
                        }
                    }
                });
            };

        	$scope._buildGroups = function(stop) {
        		$scope.items = []; // the viewModel (view of the model)
        		$.each(stop.shipment.groups, function(i, group) {
        			$scope.items.push({
        				isHeader: true,
        				code: group.name
        			});

        			$.each(group.items, function(j, item) {
        				$scope.items.push({
        					code: item.code,
        					customerId: item.customerId,
        					isDeviated: item.isDeviated,
            				isHandled: item.isHandled,
                            deviations: item.deviations,
                            deviationPhotos: item.deviationPhotos,
            				reason: item.isHandled == true ? item.reason :
                                (item.isDeviated == true ?
                                 (item.deviations && item.deviations.length > 0 ? item.deviations[0].description : '') : '')
        				});
        			});
        		});

        		$scope.currentItems = [].concat($scope.items.slice(0, $scope.pageSize));
        		$scope.pager.endIndex = Math.min($scope.pageSize, $scope.currentItems.length);
                $scope.pager.count = $scope.items.length;
        	};

            $scope.$on('modal.hidden', function(event, modal) {
                if ($scope.stopModalChain)
                    return;

                if (modal.id == $scope.stopPodCheckCashModal.id && // if different modal, just move on
                    $scope.extendedServices.cash != undefined) { // if no cash service, move to pallet or unhandled
                    if ($scope.extendedServices.pallet != undefined && $scope.extendedServices.pallet.isHandled == false)
                        $scope.openPodCheckModal('pallet');
                    else if ($scope.areAllHandled == false)
                        $scope._checkHandledItems();
                    else
                        $scope._signStop();
                } // else do nothing

                if (modal.id == $scope.stopPodCheckPalletModal.id) { // if different modal, just move on
                    if ($scope.extendedServices.pallet) { // if no pallet service, move to unhandled
                        if ($scope.areAllHandled == false)
                            $scope._checkHandledItems();
                        else
                            $scope._signStop();
                    }
                } // else do nothing

                if (modal.id == $scope.stopPodCheckHandledModal.id) { // if different modal, just move on // if different modal, just move on
                    if ($scope.areAllHandled)
                        $scope._signStop();
                } // else do nothing
            });

            $scope._checkHandledItems = function() {
                if (!$scope.areAllHandled && $scope.stopPodCheckHandledModal != undefined)
                    $scope.openPodCheckModal('unhandled');
                else
                    $scope._signStop();
            };

            $scope.onDeviateUnhandled = function() {
                $.when(deviationsService.loadDeviations())
                .then(function(deviations) {

                    $.each($scope.stop.shipment.groups, function(i, group){
                        var deviation = utilsService.getDeviation(deviations, group.type, 'M');

                        if (deviation == null) {
                            console.warn('[StopHandlingController] - deviateUnhandled - deviation is missing');
                            alert('No missing deviation!');
                            return;
                        };

                        deviation.kind = $scope.messages.deviations[deviation.type];
                        deviation.description = $scope.messages.deviations[deviation.value];

                        $.each($scope.items, function(i, item){
                            if (!item || item.isHeader || item.isDeviated || item.isHandled)
                                return;

                            item.deviations = [].concat(deviation);
                            item.isDeviated = true;
                        });
                    });

                    $scope._checkAllItems();
                    $scope._mapItemsToStopItems();
                    $scope._signStop();
                });
            };

            $scope._checkAllItems = function() {
            	$scope.areAllHandled = true;

            	$.each($scope.items, function(i, item) {
            		if (item.isHeader)
            			return;

        			$scope.areAllHandled = $scope.areAllHandled && (item.isDeviated || item.isHandled);
        		});
            };

            $scope._signStop = function() {
                $.when(utilsService.saveStopAsync($scope.stop))
                .then(function() {
                    device.removeBarcodeCallback();
                    $state.go('signStop', { id: $scope.stop.id });
                });
            };

            $scope._computeTotalNumberOfItems = function(groups) {
                if (!groups)
                    return;

            	return utilsService.computeTotalNumberOfItems(groups);
            };

            $scope.openUnknownStopModal = function() {
                if ($scope.unknownStopModal)
                    $scope.unknownStopModal.show();
            };

            $scope.closeUnknowStopModal = function() {
                if ($scope.unknownStopModal)
                    $scope.unknownStopModal.hide();
            };

            $scope.openMenu = function($event) {
            	if ($scope.handlingMenu)
            		$scope.handlingMenu.show($event);
            };

            $scope.onActionSelected = function(action) {
                switch (action) {
                    case "toggleID":
                    	$scope.handlingMenu.hide();
                    	$scope.switchBetweenCustomerIdAndItemCode();
                        break;
                    case "consolidate":
                        $scope.handlingMenu.hide();
                        device.removeBarcodeCallback();
                        $state.go("stops.todo", { status: "todo", selectedStopId: $scope.stop.id, operation: 'consolidate' });
                        break;
                    case "move":
                        $scope.handlingMenu.hide();
                        device.removeBarcodeCallback();
                        $state.go("stop-move-shipments", { id: $scope.stop.id, parentView: "StopHandling" });
                        break;
                    case "add":
                        device.removeBarcodeCallback();
                        $state.go("create-stop", { id: $scope.stop.id, parentView: "StopHandling" })
                        break;
                    case "cancel":
                        device.removeBarcodeCallback();
                        // go to cancel causes and cancel the stop
                        break;
                    default:
                        break;
                }
            };

            $scope.showItemNr = function(item) {
            	if (($scope.showCustomerIdMenuItem === true) || (item.customerId === undefined)) {
            		return item.code;
            	} else {
            		return item.customerId;
            	}
            };

            $scope.showCustomerIdOrItemCodeMenu = function() {
            	if ($scope.showCustomerIdMenuItem === true) return $scope.messages.customerIds;
            	else return $scope.messages.ssId;
            };

            $scope.switchBetweenCustomerIdAndItemCode = function () {
            	$scope.showCustomerIdMenuItem = !$scope.showCustomerIdMenuItem;
            };

            $scope.disableCustomerIdMenuItem = function(stop) {
                if (stop == undefined)
                    return false;

            	var groups = stop.shipment.groups;
            	for (var i=0; i< groups.length; i++){
            		var items = groups[i].items;
            		for (var j=0; j<items.length; j++) {
            			if (items[j].hasOwnProperty('customerId')) return false;
            		}
            	}
            	return true;
            }

            $scope._isDelivery = function(stop) {
                return utilsService.isDelivery(stop);
            };

            $scope._isPickup = function(stop) {
                return utilsService.isPickup(stop);
            };
        };

        return StopHandlingController;
    })
})();
