(function () {
    'use strict';

    define(['sync', 'lodash'], function (sync, _) {

        UtilsService.$inject = ['LocalDBService'];

        function UtilsService(localDBService) {
        	this.clearDBResults = function(arrayOfResults) {
    			return sync.clearDBResults(arrayOfResults);
    		};

    		this.createGuid = function() {
    			function s4() {
				    return Math.floor((1 + Math.random()) * 0x10000)
				      .toString(16)
				      .substring(1);
    			}
    			return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
			};

			this.getStopsByStatus = function(stops, status, predicate) {
				var _stops = {
                	todo: [],
                	canceled: [],
                	done: []
                };

                for (var i = 0; i < stops.length; ++i) {
                	var st = stops[i].status;
                	if (!predicate) {
                    	_stops[st].push(stops[i]);
                    	continue;
                	}
                	if (predicate(stops[i]) == true) {
                    	_stops[st].push(stops[i]);
                    	continue;
                	}
                }

                return _stops[status];
			};

			this.findInArray = function(array, predicate) {
            	if (!array || array.length == 0)
            		return null;
            	if (!predicate)
            		return null;

            	for (var i = 0; i < array.length; ++i) {
            		if (predicate(array[i]))
            			return { value: array[i], index: i };
            	}

            	return null;
            };

            this.objectLength = function(object) {
                // returns 0 for undefined objects
                object = typeof object == 'undefined' ? {} : object;
                return Object.keys(object).length;
            };

            this.validateSiteIdBarcode = function(siteId) {
            	if (!siteId || siteId.length == 0)
            		return false;

            	if (typeof siteId !== 'string')
            		return false;

            	var type = siteId.substring(0, 3);
            	if (type != '414' && type != 'DSV')
            		return false;

            	siteId = siteId.substring(3);
            	var oddSum = 0;
            	var evenSum = 0;
            	var allSum = 0;
            	for (var i = 0; i < siteId.length; ++i) {
            		if (i % 2 == 0) {
            			evenSum += parseInt(siteId[i]);
            		} else {
            			oddSum += parseInt(siteId[i]);
            		}
            		allSum += parseInt(siteId[i]);
            	}

            	var lastDigit = parseInt(siteId[siteId.length - 1]);

            	if (type == '414') {
            		if (10 - (oddSum*3 + evenSum) % 10 == lastDigit)
            			return true;
            	}

            	if (type == 'DSV') {
            		if (10 - allSum % 10 == lastDigit)
            			return true;
            	}

            	return false;
            };

            this.computeTotalNumberOfItems = function(groups) {
            	return groups.reduce(function(previousValue, currentValue, index, array) {
            		  return previousValue + currentValue.items.length;
            	}, 0);
            };

            this.computeUnhandledItems = function(items) {
                return items.reduce(function(previousValue, currentValue, index, array) {
                    return !currentValue.isHandled &&
                        !currentValue.isDeviated &&
                        !currentValue.isHeader ?
                            previousValue + 1 : previousValue;
                }, 0);
            };

            this.computeDeliveredItems = function(items) {
                return items.reduce(function(previousValue, currentValue, index, array) {
                    return currentValue.isHandled &&
                        !currentValue.isHeader ?
                            previousValue + 1 : previousValue;
                }, 0);
            };

            this.computeDeviatedItems = function(items) {
                return items.reduce(function(previousValue, currentValue, index, array) {
                    return currentValue.isDeviated &&
                        !currentValue.isHeader ?
                            previousValue + 1 : previousValue;
                }, 0);
            };

            this.computeDeliveredShipments = function(groups) {
            	return groups.reduce(function(previousValue, currentValue, index, array) {
            		var allItemsHandled = true;
            		for(var i = 0; i < currentValue.items.length; i++){
            			if((!currentValue.items[i].isHandled || currentValue.items[i].isDeviated) && !currentValue.items[i].isHeader){
            				allItemsHandled = false;
            				break;
            			}
            		}
            		 return allItemsHandled ? previousValue + 1 : previousValue;
            	}, 0);
            };

            this.loadStopAsync = function(id) {
                var dfd = $.Deferred();
                var self = this;

                $.when(localDBService.init(DSV.constants.DSVStops, { searchFields: DSV.searchFields[DSV.constants.DSVStops] }))
	            .then(function() {
	                $.when(localDBService.find(DSV.constants.DSVStops, { id: id }))
	                .then(function(results) {
                        localDBService.closeAll();

	                	if (!results || results.length == 0) {
	                		console.warn('[UtilsService/loadStop] - No stop found!');
	                		dfd.reject('No stop found!');
	                		return;
	                	}

	                	console.log('[UtilsService/loadStop] - Stop found!');

	                	dfd.resolve(self.clearDBResults(results)[0]);
	                })
	                .fail(function(err) {
                        localDBService.closeAll();
	                	console.error('[UtilsService/loadStop] - ' + err);
	                	dfd.reject(err);
	                });
	            })
	            .fail(function(err) {
                    localDBService.closeAll();
                	console.error('[UtilsService/loadStop] - ' + err);
                	dfd.reject(err);
                });

                return dfd.promise();
            };

            this.saveStopAsync = function(stop) {
                stop.timestamp = new Date().getTime();

                if (stop.mvvm != undefined) {
                    delete stop.mvvm;
                }

                var dfd = $.Deferred();

            	$.when(localDBService.init(DSV.constants.DSVStops, { searchFields: DSV.searchFields[DSV.constants.DSVStops] }))
                .then(function() {
	            	$.when(localDBService.find(DSV.constants.DSVStops, { id: stop.id }))
	                .then(function(results) {
	                    if (results.length == 1) {
	                    	$.when(localDBService.replace(DSV.constants.DSVStops, { id: stop.id }, stop))
	                    	.then(function() {
                                localDBService.closeAll();
	                    		dfd.resolve();
	                    	})
	                    	.fail(function(err) {
                                localDBService.closeAll();
	                    		console.error('[UtilsService/saveStop] - Error: ' + stop.id);
	                    		dfd.reject(err);
	                    	});
	                    } else {
                            if (results.length == 0) {
                                $.when(localDBService.add(DSV.constants.DSVStops, stop))
                                .then(function() {
                                    localDBService.closeAll();
                                    dfd.resolve();
                                })
                                .fail(function(err) {
                                    localDBService.closeAll();
                                    console.error('[UtilsService/saveStop] - Error: ' + stop.id);
                                    dfd.reject(err);
                                });
                            } else {
                                localDBService.closeAll();
                                console.error('[UtilsService/saveStop] - Found multiple stops: ' + stop.id);
                                dfd.reject('Found multiple stops: ' + stop.id);
                            }
	                    }
	                })
	                .fail(function(err) {
                        localDBService.closeAll();
	            		console.error(err);
	            		dfd.reject(err);
	            	});
                }).fail(function(err) {
                    localDBService.closeAll();
            		console.error(err);
            		dfd.reject(err);
            	});

                return dfd.promise();
            };

            this.removeStopAsync = function(id) {
                var dfd = $.Deferred();
                var self = this;

                $.when(localDBService.init(DSV.constants.DSVStops, { searchFields: DSV.searchFields[DSV.constants.DSVStops] }))
	            .then(function() {
	                $.when(localDBService.find(DSV.constants.DSVStops, { id: id }))
	                .then(function(results) {
                        if (!results || results.length == 0) {
	                		console.warn('[UtilsService/removestop] - No stop found!');
	                		dfd.resolve();
	                		return;
	                	}

                        results = self.clearDBResults(results);
	                	$.when(localDBService.remove(DSV.constants.DSVStops, results[0]))
                        .then(function() {
                            dfd.resolve();
                        })
                        .fail(function() {
                            dfd.resolve();
                        })
	                })
	                .fail(function(err) {
                        localDBService.closeAll();
	                	console.error('[UtilsService/loadStop] - ' + err);
	                	dfd.resolve();
	                });
	            })
	            .fail(function(err) {
                    localDBService.closeAll();
                	console.error('[UtilsService/loadStop] - ' + err);
                	dfd.resolve();
                });

                return dfd.promise();
            }

            this.loadCollectionAsync = function(collectionName) {
                return sync.loadCollectionAsync(collectionName);
            };

            this.saveCollectionAsync = function(collectionName, collection) {
            	return sync.saveCollectionAsync(collectionName, collection);
            };

            this.removeCollectionAsync = function(collectionName, collection) {
            	return sync.removeCollectionAsync(collectionName, collection);
            };

            this.findItemInStopAsync = function(itemCode) {
                var dfd = $.Deferred();

                if(!itemCode) {
                    dfd.reject();
                    return dfd.promise();
                }

                var self = this;

                $.when(this.loadCollectionAsync(DSV.constants.DSVStops))
                .then(function(stops) {
                    var foundStop = null;
                    $.each(stops, function(i, stop) {
                        if (self.findItemByCode(stop, itemCode) != null) {
                            foundStop = stop;
                        }
                    });

                    dfd.resolve(foundStop);
                })
                .fail(function(error) {
                    console.error('[UtilService/findItemInStop] - Unable to load local stops!' + error);
                    dfd.reject(error);
                });

                return dfd.promise();
            };

            this.findItemByCode = function(stop, itemCode) {
                if (!stop || !itemCode)
                    return null;

                var stopItem = null;
                $.each(stop.shipment.groups, function(i, group) {
                    $.each(group.items, function(j, item) {
                        if (item.code == itemCode)
                            stopItem = item;
                    });
                });

                return stopItem;
            };

            this.getStopService = function(stop, serviceType) {
                if (!stop || !serviceType)
                    return null;

                var self = this;
                var stopService = null;
                $.each(stop.shipment.groups, function(i, group) {
                    var service = self.getService(group.services, serviceType);
                    if (service)
                        stopService = service;
                });

                return stopService;
            };

            this.getService = function(services, serviceType) {
                if (!services || !serviceType)
                    return null;

                serviceType = serviceType.toLowerCase();
                var foundService = null;

                $.each(services, function(i, service){
                    if (service.type.toLowerCase() == serviceType)
                        foundService = service;
                });

                return foundService;
            };

            this.getItemsBy = function(items, type, value) {
                // available types : isHandledd, isDeviated, isHeader code
                // getItemBy(items, isHandled, true) will return all items that are handled

                if (!items || !type || !value)
                    return null;

                var availableTypes = ['isHandled', 'isDeviated', 'isHeader', 'code'];

                if (availableTypes.indexOf(type) == -1 ) {
                    console.error( '[UtilsService - getItemsBy] ' + type + ' does not exist as an item key');
                    return null;
                }

                // Do not need an array since we have only one result for code
                var itemsStop = (type == 'code' ? '' : []);
                $.each(items, function(i, item) {
                    if (item[type] == value) {
                        if(type == 'code')
                            itemsStop = item;
                        else
                            itemsStop.push(item);
                    }
                });

                return itemsStop;
            };

            this.getCollectionBatch = function(count, pager, collection) {
                if (count > 0) {
                    pager.startIndex = Math.min(pager.startIndex + count, collection.length);
                    pager.endIndex = Math.min(pager.endIndex + count, collection.length);

                    if (pager.endIndex == collection.length) {
                        if (pager.endIndex % count != 0)
                            pager.startIndex = pager.endIndex - pager.endIndex % count;

                        if (pager.startIndex == pager.endIndex)
                            pager.startIndex = pager.endIndex - count;
                    }
                } else {
                    pager.startIndex = Math.max(pager.startIndex - Math.abs(count), 0);
                    pager.endIndex = Math.min(pager.startIndex + Math.abs(count), collection.length);
                }

                return collection.slice(pager.startIndex, pager.endIndex);
            };

            this.mergeServices = function(groups) {
                if (groups == undefined)
                    return;

                // Use temp variable to avoid modifying the scope
                var tempGroups = angular.extend({}, groups);
                var services = [];

                $.each(tempGroups, function(i, group) {
                    $.each(group.services, function(j, service) {
                        if (services.length == 0) {
                            services.push(_.cloneDeep(service));
                        } else {
                            var found = false;
                            for (var k = 0; k < services.length; ++k) {
                                var serv = services[k];
                                if (serv.type == service.type) {
                                    found = true;
                                    if (serv.value == undefined || service.value == undefined)
                                        continue;

                                    serv.value = parseInt(serv.value) + parseInt(service.value);
                                }
                            }

                            if (found == false) {
                                services.push(_.cloneDeep(service));
                            }
                        }
                    });
                });

                return services;
            };

            this.allReplace = function(str, obj) {
                for (var x in obj) {
                    str = str.replace(new RegExp(x, 'g'), obj[x]);
                }
                return str;
            };

            this.openToast = function(toast) {
                if (toast) {
                    var dfd = $.Deferred();
                    // Be sure that the class is added right before the modal is shown to already have the toast style
                    toast.$el.addClass('modal-as-toast');
                    toast.show().then(function(){
                        dfd.resolve();
                    });

                    return dfd.promise();
                }
            };
            this.closeToast = function(toast) {
                if (toast) {
                    toast.hide().then(function(){
                        // Remove class after the toast was hidden to avoid styling problem
                        toast.$el.removeClass('modal-as-toast');
                    });
                }
            };

            this.computeTotalWeight = function(stop) {
                if (!stop) {
                    return '0kg';
                }

                var sum = 0; var unit = 'kg';
                $.each(stop.shipment.groups, function(j, group) {
                    sum += parseInt(group.weight.value);
                    unit = group.weight.unit;
                });

                return sum + unit;
            };

            this.isDelivery = function(stop) {
                var result = false;

                if (!stop)
                    return result;

                $.each(stop.shipment.groups, function(i, group) {
                    if (group.type == 2)
                        result = true;
                });

                return result;
            };

            this.isPickup = function(stop) {
                var result = false;

                if (!stop)
                    return result;

                $.each(stop.shipment.groups, function(i, group) {
                    if (group.type == 1)
                        result = true;
                });

                return result;
            };

            this.findUnallocatedGroup = function(groups) {
                var unallocatedGroup = null;
                $.each(groups, function(i, group) {
                    if (group.name == 'Unallocated items')
                        unallocatedGroup = group;
                });

                return unallocatedGroup;
            };

            this.isItemHandled = function(items) {
                if (!items || items.lenght == 0)
                    return false;

                for (var i = 0; i < items.length; ++i) {
                    if (items[i].isHandled == true || items[i].isDeviated == true)
                        return true;
                }
                return false;
            };

            this.getDeviation = function(deviations, type, value) {
                var devResult = null;
                $.each(deviations, function(i, deviation) {
                    if (deviation.isEnabledForItem && deviation.type == type && deviation.value == value) {
                        devResult = deviation;
                    }
                });

                return devResult;
            };
        }
        return UtilsService;
    });
})();
