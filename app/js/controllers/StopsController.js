(function () {
    'use strict';
    define(['device'], function (device) {
        StopsController.$inject = ['$rootScope', '$scope', '$ionicLoading', '$timeout', '$ionicModal',
                                       '$ionicPopover', '$stateParams', '$ionicNavBarDelegate', '$state',
                                       'UtilsService', 'StopsService', 'TranslatorService'];

        function StopsController($rootScope, $scope, $ionicLoading, $timeout, $ionicModal,
        							$ionicPopover, $stateParams, $ionicNavBarDelegate, $state,
        							utilsService, stopsService, translatorService) {
            var SIZE = DSV.constants.stopsListPageSize;

            $scope.pager = {};
            $scope.pager.startIndex = 0;
            $scope.stops = [];
            $scope.currentStops = [];
            $scope.allStops = [];
            $scope.pageSize = SIZE;
            $scope.selectionStops = [];
            $scope.selectionStopsText = "No selected stops";
            $scope.isTransport = DSV.driver.isTransport;
            $scope.pager.showNumbers = true;
            $scope.useFirstParameters = true;  //false if one of the parameters, for example route has changed
            $scope.selectedStopId = '';
            $scope.isGroupedEnabled = false;
            $scope.isSingleSelectEnabled = false;

            $ionicNavBarDelegate.showBackButton(true);
            $('#sideMenu').removeClass('hide');

            // on load
            $scope.$on('$ionicView.enter', function() {
            	$scope.messages = DSV.constants.messages;
                $scope.isGroupedEnabled = false;
                $scope.isSingleSelectEnabled = false;
                $scope.selectionStops = [];

                $scope._initState();
                $scope._initPopups();

                if (DSV.driver.existsTransportRoute) {
                    //if(!$scope.useFirstParameters) { // TODO: ask Silvia
                        $scope.loadStops($scope.status);
                    //}
                } else {
                    $scope.stops = [];
                    $scope.currentStops = [];
                    $scope.allStops = [];
                }

    			try {
    				device.addBarcodeCallback(function(data) {
    					$scope._searchBarcode(data.data);
    				});
    			} catch (e) {
    				console.error('Error on barcode scan callback: ' + e);
    			}
            });

            $scope.loadStops = function(status) {
            	console.log('[StopsController] - Loading stops...');
            	SIZE = DSV.constants.stopsListPageSize;
            	var dfd = $.Deferred();
            	$ionicLoading.show({
            		template: 'Loading... Please wait!'
            	});

            	$.when($scope._loadStops())
                .then(function(stops) {
                	if (stops.length == 0) { // no local stops - get them from server
                		$.when($scope._getServerStops(status))
                		.then(function(serverStops) {
                			$.when(utilsService.saveCollectionAsync(DSV.constants.DSVStops, serverStops))
                        	.then(function() {
                    			$scope._initStopsCollections(serverStops, status);
                                $ionicLoading.hide();
                                dfd.resolve(serverStops);
                        	})
                            .fail(function(error) {
                            	console.error('[StopsController/loadStops] - Unable to save stops!' + error);
                            	dfd.reject(error);
                            });
                		})
                		.fail(function(error) {
                			console.error('[StopsController/loadStops] - Unable to get server stops!' + error);
                			dfd.reject(error);
                		});
                	} else {
                		$scope._initStopsCollections(stops, status);
                        $ionicLoading.hide();
                		//$scope._searchBarcode("00357065931232152129");

                    	dfd.resolve(stops);
                	}
                })
                .fail(function(error) {
            		console.error('[StopsController/loadStops] - Unable to load local stops!' + error);
                	$ionicLoading.hide();

                	dfd.reject(error);
                });

                return dfd.promise();
            };

            // paget actions
            $scope.onNext = function() {
                $scope.currentStops = [].concat(utilsService.getCollectionBatch(SIZE, $scope.pager, $scope.stops));
            };

            $scope.onPrev = function() {
                $scope.currentStops = [].concat(utilsService.getCollectionBatch(-SIZE, $scope.pager, $scope.stops));
            };

            // stops menu actions
            $scope.openMenu = function($event) {
                if ($scope.actionsMenu)
                	$scope.actionsMenu.show($event);
            };

            $scope.openInbox = function(withSearch) {
                device.removeBarcodeCallback();
                $state.go('stops-inbox', { withSearch: withSearch });
            };

            $scope.$on('$destroy', function() {
                if ($scope.actionsMenu)
					$scope.actionsMenu.remove();
				if ($scope.sortPopup)
					$scope.sortPopup.remove();
				if ($scope.consolidatePopup)
					$scope.consolidatePopup.remove();
				if ($scope.toast)
					$scope.toast.remove();
				if ($scope.unknownItemPopup)
					$scope.unknownItemPopup.remove();

				try {
					device.removeBarcodeCallback();
				} catch (e) {
					console.error('Error on adding barcode callback: ' + e);
				}
            });

            // events
            $scope.onActionSelected = function(actionName) {
            	switch (actionName) {
            		case 'sort':
            			if($scope.sortPopup)
            				$scope.sortPopup.show();
            			$scope.isGroupedEnabled = false;
            			$scope.isSingleSelectEnabled = false;
            			break;
            		case 'group':
            			$scope.isGroupedEnabled = true;
            			break;
            		case 'split':
            			$scope.isSingleSelectEnabled = true;
            			break;
            		case 'create':
                        device.removeBarcodeCallback();
                        $state.go('create-stop', { parentView: "Stops" });
                        break;
            		case 'get':
                        $scope.openInbox(true);
                        break;
            		default:
            			$scope.isGroupedEnabled = false;
            			$scope.isSingleSelectEnabled = false;
            			break;
        		}

            	if ($scope.actionsMenu)
            		$scope.actionsMenu.hide();

            	$scope.$emit('selectionModeChanged',
            			$scope.isGroupedEnabled == true || $scope.isSingleSelectEnabled == true);
            };

            $scope.onSortChanged = function(sortType) {
            	console.log('[StopsController] - Sorting stops...');
            	var dfd = $.Deferred();
            	$scope._hideSortPopup();

            	function dynamicSort(property) {
            	    var sortOrder = 1;
            	    if(property[0] === "-") {
            	        sortOrder = -1;
            	        property = property.substr(1);
            	    }
            	    return function (a,b) {
            	        var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
            	        return result * sortOrder;
            	    }
            	};

            	switch (sortType) {
	        		case 'postal-code-asc':
	        			$scope.allStops.sort(dynamicSort("postalCode"));
	        			break;
	        		case 'postal-code-desc':
	        			$scope.allStops.sort(dynamicSort("-postalCode"));
	        			break;
	        		case 'name-asc':
	        			$scope.allStops.sort(dynamicSort("name"));
	        			break;
	        		case 'name-desc':
	        			$scope.allStops.sort(dynamicSort("-name"));
	        			break;
	        		case 'load-sequence-asc':
	        			$scope.allStops.sort(dynamicSort("loadSequence"));
	        			break;
	        		case 'load-sequence-desc':
	        			$scope.allStops.sort(dynamicSort("-loadSequence"));
	        			break;
	        		default:
	        			break;
            	}

            	$scope._initStopsCollections($scope.allStops, $scope.status);

                dfd.resolve();
                return dfd.promise();
            };

            $scope.onGroupStops = function() {
            	if ($scope.selectionStops.length > 1) {
                    $scope.consolidatePopup.show();
                }
            };

            $scope.$on('modal.hidden', function(modal) {
            	if ($scope.isGroupedEnabled) {
            		$scope.onCancelGroupStops();
            	}
            });

            $scope.onParentStopSelected = function(parentId) {
            	var dfd = $.Deferred();

            	$ionicLoading.show({
            		template: 'Consolidating... Please wait!'
            	});

            	var parentStopObj = $scope._getStopById($scope.allStops, parentId);
                parentStopObj.value.isConsolidated = true;

            	// merge shipments in parent shipments
            	for (var i = 0; i < $scope.selectionStops.length; ++i) {
            		var selectionStop = $scope.selectionStops[i];

            		if (selectionStop.id != parentId) {
                		var childStopObj = $scope._getStopById($scope.allStops, selectionStop.id);
                        childStopObj.value.parentId = parentId;

                		var groups = childStopObj.value.shipment.groups;

            			for (var j = 0; j < groups.length; ++j) {
            				var group = groups[j];
            				parentStopObj.value.shipment.groups.push(group);
            			}

                        childStopObj.value.isMerged = true;
            		}
            	}

            	// save locally the consolidated stops
            	$.when(utilsService.saveCollectionAsync(DSV.constants.DSVStops, $scope.allStops))
            	.then(function() {
            		$scope._initStopsCollections($scope.allStops, $scope.status);
                    dfd.resolve();
            	})
                .fail(function(error) {
                	console.error('[StopsController/onParentStopSelected] - Unable to save stops... ' + err);
                	dfd.reject(error);
                })
                .always(function() {
                	$scope.onCancelGroupStops();

                	if ($scope.consolidatePopup)
                		$scope.consolidatePopup.hide();

                	$ionicLoading.hide();
                });

            	return dfd.promise();
            };

            $scope.viewDetails = function(id, event) {
            	if (!$scope.isGroupedEnabled) {
                    device.removeBarcodeCallback();
            		$state.go('stop.info', { id: id, signMode : false });
            	}
            };

            $scope.onStopSelected = function(id, event) {
            	var selectedStop = $scope._getStopById($scope.currentStops, id);
                if (selectedStop == null) {
                    console.warn('[StopsController/onStopSelected] - Stop not found: ' + id);
                    device.removeBarcodeCallback();
                    $state.go("stops.todo", { status: "todo" });
                    return;
                }

            	if ($scope.isGroupedEnabled) {
            		// update UI
            		if (selectedStop.value.selected == true) {
            			delete selectedStop.value.selected; // remove the property

                		// update selectionStops
            			var selectionStop = $scope._getStopById($scope.selectionStops, id);
            			$scope.selectionStops.splice(selectionStop.index, 1);
            		} else {
            			selectedStop.value.selected = true;
            			$scope.selectionStops.push(selectedStop.value);
            		}

            		if ($scope.selectionStops.length == 0)
            			$scope.selectionStopsText = "No selected stops";
            		else
            			$scope.selectionStopsText = $scope.selectionStops.length + " selected stops";
            	} else if ($scope.isSingleSelectEnabled) {
                    if ($scope.operation == 'split') { // we are in split mode (started from Handle stop)
                        if ($scope.data) {
                            var sourceStop = $scope._getStopById($scope.allStops, $scope.selectedStopId);
                            if (sourceStop) {
                                $ionicLoading.show({
                                    template: 'Loading... Please wait!'
                                });

                                var groupNames = $scope.data.split("|");
                                // move shipments from sourceStop to selectedStop
                                $.each(groupNames, function(i, name) {
                                    var groups = sourceStop.value.shipment.groups;
                                    for (var j = groups.length - 1; j >= 0; --j) {
                                        var group = groups[j];
                                        if (group.name == name) {
                                            selectedStop.value.shipment.groups.push(group);
                                            sourceStop.value.shipment.groups.splice(j, 1);
                                        }
                                    }
                                });

                                // save & refresh
                                $.when(utilsService.saveStopAsync(selectedStop.value))
                                .then(function() {
                                    $.when(utilsService.saveStopAsync(sourceStop.value))
                                    .then(function() {
                                        $ionicLoading.hide();

                                        var text = $scope.messages.movedShipments
                                            .replace("__COUNT__", groupNames.length)
                                            .replace("__NAME__", selectedStop.value.name);
                                        $scope._onMoveCompleted(text);
                                    })
                                    .fail(function() {
                                        $ionicLoading.hide();
                                    });
                                })
                                .fail(function() {
                                    $ionicLoading.hide();
                                });
                            }
                        }
                    } else {
                        if ($scope.operation == 'appendTo') { // we are in append mode (from Stops inbox)
                            $scope._appendToStop(selectedStop.value);
                        } else if ($scope.operation == 'addItems') { // we are in add items (from Scan item)
                            device.removeBarcodeCallback();
                            $state.go('create-stop', { id: selectedStop.value.id, itemCode: $scope.scannedData.barcode, parentView: "Stops" });
                        } else { // we are spliting directly from Stop list, so we need to redirect to Move Shipments View
                            device.removeBarcodeCallback();
                            $state.go('stop-move-shipments', { id: selectedStop.value.id, parentView: "Stops" });
                        }
                    }
            	} else {
                    device.removeBarcodeCallback();
                    $state.go('stop-handling', { id: id });
            	}
            };

            $scope.onCancelGroupStops = function() {
            	$scope.isGroupedEnabled = false;

            	for (var i = 0; i < $scope.selectionStops.length; ++i) {
            		var selectionStop = $scope.selectionStops[i];
            		if (selectionStop.selected) {
            			delete selectionStop.selected;
            		}
            	}

            	$scope.selectionStopsText = "No selected stops";
            	$scope.selectionStops = [];

            	$scope.$emit('selectionModeChanged', false);
            };

            $scope.onCancelSingleSelectStops = function() {
            	$scope.isSingleSelectEnabled = false;
            	$scope.$emit('selectionModeChanged', false);
            };

            $scope.onUnknownItemAction = function(action) {
            	if ($scope.unknownItemPopup)
            		$scope.unknownItemPopup.hide();

            	switch(action) {
            		case 'add-to-existing-stop':
            			// TODO: 107
            			break;
            		case 'create-stop':
            			// TODO: 108
            			break;
            		case 'get-stop':
            			// TODO: 112
            			break;
            		default: break;
            	}
            }

            /* private methods */
            $scope._getServerStops = function(status) {
            	var dfd = $.Deferred();

            	stopsService.getStops()
                .then(function(stops) {
                	DSV.constants.lastConnectionTime = new Date();

                	dfd.resolve(stops);
                }, function(error) {
                	dfd.reject(error);
                });

            	return dfd.promise();
            };

            $scope._initStopsCollections = function(stops, status) {
                // create mvvm for stop
                $.each(stops, function(i, stop) {
                    stop.mvvm = {};
                    stop.mvvm.services = [];
                    stop.mvvm.services = utilsService.mergeServices(stop.shipment.groups);

                    if (stop.id == $scope.selectedStopId && $scope.isGroupedEnabled == true) { // select the one that needs to be consolidated
                        stop.selected = true;
                        $scope.selectionStops.push(stop);
                        $scope.selectionStopsText = $scope.selectionStops.length + " selected stop(s)";
                    }
                });

            	$scope.allStops = stops;
                $scope.stops = utilsService.getStopsByStatus($scope.allStops, status, function(stop) {
        			return stop.isMerged == undefined || stop.isMerged == false;
        		});
                $scope.currentStops = [].concat($scope.stops.slice(0, SIZE));
                $scope.pager.endIndex = Math.min(SIZE, $scope.currentStops.length);
                $scope.pager.count = $scope.stops.length;
                // notify parent scopes that we have data
                $scope.$emit('stopsRetrieved', $scope.allStops);
            };

            $scope._hideSortPopup = function() {
            	if ($scope.sortPopup)
            		$scope.sortPopup.hide();
            };

            $scope._loadStops = function() {
            	var dfd = $.Deferred();

                $.when(utilsService.loadCollectionAsync(DSV.constants.DSVStops))
                .then(function(stops) {
                    dfd.resolve(stops);
                })
                .fail(function(error) {
                    console.error('[StopsController] - Unable to load local stops!' + error);
                    dfd.reject(error);
                });

                return dfd.promise();
            };

            $scope._searchBarcode = function(barcode) {
            	$scope.toastData = {};
            	$scope.toastData.found = false;
            	$scope.toastData.code = barcode;

                $scope.scannedData = { barcode: barcode };

            	$.each($scope.stops, function(i, stop) {
            		$.each(stop.shipment.groups, function(j, group) {
            			$.each(group.items, function(k, item) {
            				if (item.code === barcode) {
            					item.isHandled = true;
            					item.reason = 'found by scanning';
            					$scope.toastData.text = " handled. " + utilsService.computeUnhandledItems(group.items) + " left";
            					$scope.toastData.found = true;

            					// update locally
            					$scope._replaceStop(stop);
            					return;
            				}
            			});
            		});
            	});

            	if (!$scope.toastData.found) {
                    $scope.isSingleSelectEnabled = true; // enter select mode
                    $scope.$emit('selectionModeChanged', true);
            	} else {
                    $scope.openToast();
                    setTimeout(function() {
                        $scope.closeToast();
                        if (!$scope.toastData.found) {
                             if ($scope.unknownItemPopup)
                                 $scope.unknownItemPopup.show();
                        }
                    }, DSV.constants.toastTimeout);
                }
            };

            $scope._replaceStop = function(stop) {
            	var dfd = $.Deferred();

				$.when(utilsService.saveStopAsync(stop))
                .then(function() {
                    dfd.resolve();
                })
                .fail(function(err) {
                    dfd.reject(err);
                });

                return dfd.promise();
            };

            $scope._getStopById = function(stops, id) {
            	return utilsService.findInArray(stops, function(stop) {
            		return stop.id == id
            	});
            };

            $scope._computeTotalNumberOfItems = function(groups) {
            	return utilsService.computeTotalNumberOfItems(groups);
            };

            $scope._initState = function() {
                $scope.status = $stateParams.status;

                if ($stateParams.selectedStopId && $stateParams.selectedStopId != '') {
                    $scope.selectedStopId = $stateParams.selectedStopId; // mark stop as selected
                }

                if ($stateParams.operation && $stateParams.operation != '') {
                    $scope.operation = $stateParams.operation;

                    if ($stateParams.operation == 'consolidate') {
                        $scope.isGroupedEnabled = true;
                        $scope.isSingleSelectEnabled = false;
                    }
                    if ($stateParams.operation == 'split' || $stateParams.operation == 'appendTo') {
                        $scope.isGroupedEnabled = false;
                        $scope.isSingleSelectEnabled = true;
                    }
                }

                if ($stateParams.data && $stateParams.data != '') {
                    $scope.data = $stateParams.data;
                }
            };

            $scope.openToast = function() {
                if ($scope.toast) {
                    // Be sure that the class is added right before the modal is shown to already have the toast style
                    $scope.toast.$el.addClass('modal-as-toast');
                    $scope.toast.show();
                }
            };

            $scope.closeToast = function() {
                if ($scope.toast) {
                    $scope.toast.hide().then(function(){
                        // Remove class after the toast was hidden to avoid styling problem
                        $scope.toast.$el.removeClass('modal-as-toast');
                    });
                }
            };

        	$rootScope.$on('useFirstParametersChanged', function(event, value) {
        		$scope.useFirstParameters = value;
        	});

            $scope._initPopups = function() {
                $ionicPopover.fromTemplateUrl('templates/StopPopups/stopsMenu.html', {
                    scope: $scope
                }).then(function(popover) {
                    $scope.actionsMenu = popover;
                });

                $ionicModal.fromTemplateUrl('templates/StopPopups/stopsSortPopup.html', {
                    scope: $scope
                }).then(function(modal) {
                    $scope.sortPopup = modal;
                });

                $ionicModal.fromTemplateUrl('templates/StopPopups/stopsConsolidatePopup.html', {
                    scope: $scope
                }).then(function(modal) {
                    $scope.consolidatePopup = modal;
                });

                $ionicModal.fromTemplateUrl('templates/StopPopups/stopsToast.html', {
                    scope: $scope
                }).then(function(modal) {
                    $scope.toast = modal;
                });

                $ionicModal.fromTemplateUrl('templates/StopPopups/stopsUnknownItemPopup.html', {
                    scope: $scope
                }).then(function(modal) {
                    $scope.unknownItemPopup = modal;
                });

                $ionicModal.fromTemplateUrl('templates/StopPopups/simpleToast.html', {
                    scope: $scope
                }).then(function(modal) {
                    $scope.simpleToast = modal;
                });
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

            $scope._appendToStop = function(stop) {
                $ionicLoading.show({
                    template: 'Loading... Please wait!'
                });

                var groups = stop.shipment.groups;
                var unallocatedGroup = utilsService.findUnallocatedGroup(groups);

                var newItem = {
                    code: $scope.data,
                    isHandled: false,
                    isDeviated: false
                };

                if (unallocatedGroup == null) {
                    groups.push({
                        name: 'Unallocated items',
                        type: 1,
                        items: [newItem],
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
                    });
                } else {
                    unallocatedGroup.items.push(newItem);
                }

                $.when(utilsService.saveStopAsync(stop))
                .then(function() {
                    $ionicLoading.hide();
                    var text = $scope.messages.movedShipments
                        .replace("__COUNT__","1")
                        .replace("__NAME__", stop.name);
                    $scope._onMoveCompleted(text);
                });
            };

            $scope._onMoveCompleted = function(text) {
                $scope.simpleToastData = {};
                $scope.simpleToastData.text = text;

                $scope.isSingleSelectEnabled = false;
                $scope._initStopsCollections($scope.allStops, $scope.status);

                $.when(utilsService.openToast($scope.simpleToast))
                .then(function(){
                    $timeout(function() {
                        utilsService.closeToast($scope.simpleToast);
                    }, DSV.constants.toastTimeout);
                });
            }
        };

        return StopsController;
    });
})();
