(function () {
    'use strict';
    define([], function () {

        StopDeviationController.$inject = ['$rootScope', '$scope', '$stateParams', '$ionicLoading', '$state',
                                          'TranslatorService', 'UtilsService', 'StopDeviationsService'];

        function StopDeviationController($rootScope, $scope, $stateParams, $ionicLoading, $state,
                                         translatorService, utilsService, deviationsService) {

            var SIZE = DSV.constants.fullListPageSize;
            $scope._init = function() {
                $scope.pager = {};
                $scope.pager.startIndex = 0;
                $scope.pager.endIndex = SIZE;
                $scope.pager.showNumbers = false;
                $scope.deviatedItemsCount = 0;
            };
            $scope._init();

            $scope.loadStop = function() {
				var dfd = $.Deferred();

	    		console.log('[StopDeviationController] - Loading stop...');
	    		$ionicLoading.show({
            		template: 'Loading... Please wait!'
            	});

				$.when(utilsService.loadStopAsync($scope.id))
                .then(function(stop) {
                    console.log('[StopDeviationController] - Stop found!');
                    $scope.stop = stop;
                    $.when(deviationsService.loadDeviations())
                    .then(function(deviations) {
                        $scope.deviations = [];
                        $scope._buildDeviations(deviations);

                        $scope.currentDeviations = [].concat($scope.deviations.slice(0, SIZE));
                        $scope.pager.endIndex = Math.min(SIZE, $scope.currentDeviations.length);
                        $scope.pager.count = $scope.deviations.length;

                        $ionicLoading.hide();
                        dfd.resolve();
                    });
                })
                .fail(function() {
                    $scope.goBack();
                	$ionicLoading.hide();
                });

				return dfd.promise();
			};

    		$scope.$on('$ionicView.enter', function() {
                $scope.messages = DSV.constants.messages;
        	    $scope._init();

                if ($stateParams.id && $stateParams.id != "") {
                    $scope.id = $stateParams.id;
                    $scope.code = $stateParams.code;
                    $scope.level = $stateParams.level;
                    $scope.typeStr = $scope.messages[$scope.level];
                    $scope.parentView = $stateParams.parentView;
                }

    			$scope.loadStop();
    		});

        	$scope.goBack = function() {
                if ($scope.parentView == 'StopHandling')
        		      $state.go('stop-handling', { id: $scope.id });

                if ($scope.parentView == 'CreateStop')
      		        $state.go('create-stop', { id: $scope.id });
        	};

            $scope.onAcceptDeviations = function() {
                var dfd = $.Deferred();
                $ionicLoading.show({
            		template: 'Saving... Please wait!'
            	});

                // save locally
				$.when(utilsService.saveStopAsync($scope.stop))
                .then(function() {
                    $ionicLoading.hide();
                    $scope.goBack();
                    dfd.resolve();
                })
                .fail(function(err) {
                    $ionicLoading.hide();
                    $scope.goBack();
                    dfd.reject(err);
                });

        		return dfd.promise();
            };

            $scope.onSelectDeviation = function(deviation) {
                var dfd = $.Deferred();

                if ($scope.deviatedItemsCount >= DSV.constants.maxDeviatedItems && deviation.isSelected) {
                    deviation.isSelected = false;
                    dfd.resolve();
                    return dfd.promise();
                }

                if (!deviation.isSelected) { // remove from the items
                    $scope.deviatedItemsCount--;
                    $.each($scope.stop.shipment.groups, function(i, group) {
                        if ($scope.level == 'shipment') {
                            if (group.name == $scope.code) {
                                $.each(group.items, function(j, item) {
                                    if (!item)
                                        return;
                                    if (item.deviations == undefined)
                                        return;

                                    $.each(item.deviations, function(k, d) {
                                        if (!d)
                                            return;
                                        if (d.kind == deviation.kind && d.description == d.description) {
                                            item.isDeviated = false;
                                            item.deviations.splice(k, 1);
                                        }
                                    });
                                });
                            }
                        } else {
                            if ($scope.level == 'stop') {
                                $.each(group.items, function(j, item) {
                                    if (!item)
                                        return;
                                    if (item.deviations == undefined)
                                        return;

                                    $.each(item.deviations, function(k, d) {
                                        if (!d)
                                            return;
                                        if (d.kind == deviation.kind && d.description == d.description) {
                                            item.deviations.splice(k, 1);
                                            item.isDeviated = false;
                                        }
                                    });
                                });
                            } else {
                                $.each(group.items, function(j, item) {
                                    if (!item)
                                        return;
                                    if (item.deviations == undefined)
                                        return;

                                    if (item.code == $scope.code) {
                                        $.each(item.deviations, function(k, d) {
                                            if (!d)
                                                return;
                                            if (d.kind == deviation.kind && d.description == d.description) {
                                                item.isDeviated = false;
                                                item.deviations.splice(k, 1);
                                            }
                                        });
                                    }
                                });
                            }
                        }
                    });
                } else { // add it to items
                    $scope.deviatedItemsCount++;
                    $.each($scope.stop.shipment.groups, function(i, group) {
                        if ($scope.level == 'shipment') {
                            if (group.name == $scope.code) {
                                $.each(group.items, function(j, item) {
                                    if (!item)
                                        return;
                                    if (item.deviations == undefined)
                                        item.deviations = [];

                                    item.isDeviated = true;
                                    item.deviations.push(deviation);
                                });
                            }
                        } else {
                            if ($scope.level == 'stop') {
                                $.each(group.items, function(j, item) {
                                    if (!item)
                                        return;
                                    if (item.deviations == undefined)
                                        item.deviations = [];

                                    item.isDeviated = true;
                                    item.deviations.push(deviation);
                                });
                            } else {
                                $.each(group.items, function(j, item) {
                                    if (!item)
                                        return;
                                    if (item.deviations == undefined)
                                        item.deviations = [];

                                    if (item.code == $scope.code) {
                                        item.isDeviated = true;
                                        item.deviations.push(deviation);
                                    }
                                });
                            }
                        }
                    });
                }

                dfd.resolve();
                return dfd.promise();
            };

            // paget actions
            $scope.onNext = function() {
                $scope.currentDeviations = [].concat(utilsService.getCollectionBatch(SIZE, $scope.pager, $scope.deviations));
            };

            $scope.onPrev = function() {
                $scope.currentDeviations = [].concat(utilsService.getCollectionBatch(-SIZE, $scope.pager, $scope.deviations));
            };

            $scope._buildDeviations = function(deviations) {
                $.each(deviations, function(i, deviation) {
                    deviation.kind = $scope.messages.deviations[deviation.type.toString()];
                    deviation.description = $scope.messages.deviations[deviation.value];

                    if ($scope.level == 'stop') {
                        if (deviation.isEnabledForStop) {
                            deviation.isSelected = $scope._isDeviationOnStop(deviation);
                            $scope.deviations.push(deviation);
                        }
                    } else {
                        if ($scope.level == 'shipment') {
                            if (deviation.isEnabledForShipment) {
                                deviation.isSelected = $scope._isDeviationOnGroup(deviation);
                                $scope.deviations.push(deviation);
                            }
                        } else {
                            if (deviation.isEnabledForItem) {
                                deviation.isSelected = $scope._isDeviationOnItem(deviation);
                                $scope.deviations.push(deviation);
                            }
                        }
                    }
                });
            };

            $scope._isDeviationOnGroup = function(deviation) {
                var found = false;
                $.each($scope.stop.shipment.groups, function(i, group) {
                    if (group.name != $scope.code)
                        return;

                    $.each(group.items, function(j, item) {
                        if (item.deviations == undefined)
                            return;

                        $.each(item.deviations, function(k, dev) {
                            if (dev.type == deviation.type && dev.value == deviation.value)
                                found = true;
                        });
                    });
                });

                return found;
            };

            $scope._isDeviationOnItem = function(deviation) {
                var found = false;
                $.each($scope.stop.shipment.groups, function(i, group) {
                    $.each(group.items, function(j, item) {
                        if (item.code != $scope.code)
                            return;

                        if (item.deviations == undefined)
                            return;

                        $.each(item.deviations, function(k, dev) {
                            if (dev.type == deviation.type && dev.value == deviation.value)
                                found = true;
                        });
                    });
                });

                return found;
            };

            $scope._isDeviationOnStop = function(deviation) {
                var found = false;
                $.each($scope.stop.shipment.groups, function(i, group) {
                    $.each(group.items, function(j, item) {
                        if (item.deviations == undefined)
                            return;

                        $.each(item.deviations, function(k, dev) {
                            if (dev.type == deviation.type && dev.value == deviation.value)
                                found = true;
                        });
                    });
                });

                return found;
            };
        };

        return StopDeviationController;
    })
})();
