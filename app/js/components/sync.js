define('sync', ['localDB', 'device', 'syncQueue'], function(localDB, device, syncQueue) { // refactor further to sub-components if needed
    return {
        _gpsInterval: null,
        _transportInterval: null,
        _userDataInterval: null,

        start: function() {
            var self = this;

            // send GPS
            this._gpsInterval = setInterval(function() {
                if (DSV.driver == null || DSV.driver.username == '' || DSV.driver.vehicle == '')
                    return;

                var gpsSyncObj = { name: 'GPSSync' };
                gpsSyncObj.sync = function() {
                    var dfd = $.Deferred();

                    device.capturePosition(function(position) {
                        var positionUrl = SERVER_ROOT + 'adapters/HeartBeatAdapter/v1/heartbeat';
                            positionUrl += "?vehicleId=" + DSV.driver.vehicle;
                            positionUrl += "&lat=" + position.coords.latitude + '&long=' + position.coords.longitude;

                        $.when(self.syncPosition(positionUrl, DSV.driver))
                        .then(function() {
                            DSV.constants.lastConnectionTime = new Date();
                            dfd.resolve(); // remove from queue
                        }, function() {
                            dfd.reject(); // retry
                        });
                    }, function(err) {
                        console.warn('[Sync] - No position:' + err);
                        dfd.resolve(); // no position => remove from queue
                    });

                    return dfd.promise();
                };

                // add a GPS sync to queue
                syncQueue.enqueue(gpsSyncObj);

            }, DSV.constants.heartBeatInterval);

            // sync transport data
            this._transportInterval = setInterval(function() {
                if (DSV.driver == null || DSV.driver.username == '' ||
                    DSV.driver.transportRoute == '' || DSV.driver.vehicle == '')
                    return;

                // add a sync of transport data to queue
                var transportDataSyncObj = { name: 'NewStopsSync' };
                transportDataSyncObj.sync = function() {
                    var dfd = $.Deferred();
                    $.when(self.syncTransportData())
                    .then(function() {
                        dfd.resolve();
                    })
                    .fail(function() {
                        dfd.reject();
                    });

                    return dfd.promise();
                };
                syncQueue.enqueue(transportDataSyncObj);

            }, DSV.constants.syncTransportInterval);

            // start syncing
            syncQueue.startSync();
        },

        syncTransportData: function() {
            var dfd = $.Deferred();
            var self = this;

            $.when(self.getNewStops(DSV.driver))
            .then(function(stops) {
                DSV.constants.lastConnectionTime = new Date();

                if (stops.length == 0) {
                    dfd.resolve();
                    return;
                }

                // merge stops?
                $.when(self.saveCollectionAsync(DSV.constants.DSVNewStops, stops))
                .then(function() {
                    // notify StopsController of new stops
                    dfd.resolve();
                });
            })
            .fail(function() {
                dfd.reject(); // retry
            });

            return dfd.promise();
        },

        syncUserData: function(drv) {
            var dfd = $.Deferred();
            var self = this;

            $.when(self.syncSettings(drv))
            .then(function(){
                DSV.constants.lastConnectionTime = new Date();
                $.when(self.syncDeviations(drv))
                .then(function() {
                    DSV.constants.lastConnectionTime = new Date();
                    $.when(self.syncLanguages(drv))
                    .then(function() {
                        DSV.constants.lastConnectionTime = new Date();
                        dfd.resolve();
                    })
                    .fail(function(err) {
                        dfd.reject(err);
                    });
                })
                .fail(function(err) {
                    dfd.reject(err);
                });
            })
            .fail(function(err) {
                dfd.reject(err);
            });

            return dfd.promise();
        },

        syncSettings: function(driver) {
            var dfd = $.Deferred();
            var self = this;
            $.when(self._getSettings(driver))
            .then(function(settings) {
                DSV.settings = settings;
                $.when(self._saveSettings(settings))
                .then(function() {
                    dfd.resolve();
                });
            })

            return dfd.promise();
        },

        syncLanguages: function(driver) {
            var dfd = $.Deferred();
            var self = this;
            $.when(self._getLanguages(driver))
            .then(function(lanaguages) {
                $.when(self._saveLanguages(lanaguages))
                .then(function() {
                    dfd.resolve();
                });
            });

            return dfd.promise();
        },

        syncDeviations: function(driver) {
            var dfd = $.Deferred();

            var self = this;
             $.when(self._getDeviations(driver))
             .then(function(deviations) {
                 DSV.deviations = deviations;
                 $.when(self._saveDeviations(deviations))
                 .then(function() {
                     dfd.resolve();
                 });
             });

            return dfd.promise();
        },

        getStops: function(driver, forced) {
            var dfd = $.Deferred();

            console.log('[Sync] - getting stops...');

            /*var url = SERVER_ROOT + 'adapters/StopsAdapter/v1/stops?' +
                'vehicle=' + driver.vehicle +
                '&isTransport=' + driver.isTransport +
                '&transportRoute=' + driver.transportRoute;// to simulate off-line, rename stops to stops1

            if (driver.isTransport == false && driver.routeDate != undefined) {
                url += '&routeDate=' + driver.routeDate;
            }*/

            var url = 'data/stops.json';

            $.when(this._ajaxGet(url, driver))
            .then(function(data) {
                dfd.resolve(data.stops);
            })
            .fail(function(err) {
                dfd.reject(err);
            });

            return dfd.promise();
        },

        getNewStops: function(driver) {
            var dfd = $.Deferred();

            console.log('[Sync] - getting new stops...');

            /*var url = SERVER_ROOT + 'adapters/StopsAdapter/v1/stops/new?' +
                'vehicle=' + driver.vehicle +
                '&isTransport=' + driver.isTransport +
                '&transportRoute=' + driver.transportRoute;// to simulate off-line, rename stops to stops1

            if (driver.isTransport == false && driver.routeDate != undefined) {
                url += '&routeDate=' + driver.routeDate;
            }*/

            var url = "data/newstops.json";
            $.when(this._ajaxGet(url, driver))
            .then(function(data) {
                dfd.resolve(data.stops);
            })
            .fail(function(err) {
                dfd.reject(err);
            });

            return dfd.promise();
        },

        loadCollectionAsync: function(collectionName) {
            var dfd = $.Deferred();
            var self = this;

            $.when(localDB.init(collectionName, { searchFields: DSV.searchFields[collectionName] }))
            .then(function() {
                $.when(localDB.find(collectionName))
                .then(function(results) {
                    localDB.closeAll();

                    if (results.length == 0) {'';
                        console.warn('[Sync] - No local entites.');
                        dfd.resolve([]);
                        return;
                    }

                    dfd.resolve(self.clearDBResults(results));
                })
                .fail(function(err) {
                    console.error('[Sync] - Unable to find local entities: ' + collectionName);
                    localDB.closeAll();
                    dfd.reject();
                });
            }).fail(function(err) {
                console.error(err);
                localDB.closeAll();
                dfd.reject();
            });

            return dfd.promise();
        },

        saveCollectionAsync: function(collectionName, collection) {
            var dfd = $.Deferred();
            var self = this;

            $.when(localDB.init(collectionName, { searchFields: DSV.searchFields[collectionName] }))
            .then(function() {
                $.when(self._saveCollectionRec(collectionName, collection, 0))
                .then(function() {
                    console.log('[Sync] - Entities saved locally: ' + collectionName);
                    localDB.closeAll();
                    dfd.resolve();
                })
                .fail(function(err) {
                    localDB.closeAll();
                    dfd.resolve();
                });
            })
            .fail(function(err) {
                console.error(err);
                localDB.closeAll();
                dfd.reject();
            });

            return dfd.promise();
        },

        removeCollectionAsync: function(collectionName, collection) {
            var dfd = $.Deferred();
            var self = this;

            $.when(localDB.init(collectionName, { searchFields: DSV.searchFields[collectionName] }))
            .then(function() {
                $.when(self._removeCollectionRec(collectionName, collection, 0))
                .then(function() {
                    console.log('[Sync] - Entities removed locally: ' + collectionName);
                    localDB.closeAll();
                    dfd.resolve();
                })
                .fail(function(err) {
                    localDB.closeAll();
                    dfd.resolve();
                });
            })
            .fail(function(err) {
                console.error(err);
                localDB.closeAll();
                dfd.reject();
            });

            return dfd.promise();
        },

        clearDBResults: function(arrayOfResults) {
            return arrayOfResults.map(function(obj) {
                if (obj.json && obj._id) { // WL JSON Store
                    if (obj.json.$$hashKey)
                        delete obj.json.$$hashKey;

                    return obj.json;
                }

                // Rho store - clean model
                if (obj.$$hashKey)
                    delete obj.$$hashKey;

                // convert to objects
                if (typeof obj.isSplited === 'string') {
                    obj.isSplited = JSON.parse(obj.isSplited);
                }
                if (typeof obj.services === 'string') {
                    obj.services = JSON.parse(obj.services);
                }
                if (typeof obj.consolidated === 'string') {
                    obj.consolidated = JSON.parse(obj.consolidated);
                }
                if (typeof obj.shipment === 'string') {
                    obj.shipment = JSON.parse(obj.shipment);
                }
                if (typeof obj.parties === 'string') {
                    obj.parties = JSON.parse(obj.parties);
                }
                if (typeof obj.messages === 'string') {
                    obj.messages = JSON.parse(obj.messages);
                }
                if (typeof obj.isSelected === 'string') {
                    obj.isSelected = JSON.parse(obj.isSelected);
                }

                return obj;
            });
        },

        _saveCollectionRec: function(collectionName, collection, index, dfd) {
            if (!dfd)
                dfd = $.Deferred();

            if (index == collection.length) {
                dfd.resolve();
                return dfd.promise();
            }

            var self = this;
            var entity = collection[index];

            $.when(localDB.find(collectionName, { id: entity.id }))
            .then(function(results) {
                if (results.length == 1) {
                    $.when(localDB.replace(collectionName, { id: entity.id }, entity))
                    .then(function() {
                        self._saveCollectionRec(collectionName, collection, ++index, dfd);
                    })
                    .fail(function(err) {
                        console.error('[Sync] - Unable to replace entity: ' + entity.id);
                        self._saveCollectionRec(collectionName, collection, ++index, dfd);
                    });
                } else {
                    $.when(localDB.add(collectionName, entity))
                    .then(function() {
                        self._saveCollectionRec(collectionName, collection, ++index, dfd);
                    })
                    .fail(function(err) {
                        console.error('[Sync] - Unable to add entity: ' + entity.id);
                        self._saveCollectionRec(collectionName, collection, ++index, dfd);
                    });
                }
            })
            .fail(function(err) {
                console.error(err);
                dfd.reject(err);
            });

            return dfd.promise();
        },

        _removeCollectionRec: function(collectionName, collection, index, dfd) {
            if (!dfd)
                dfd = $.Deferred();

            if (index == collection.length) {
                dfd.resolve();
                return dfd.promise();
            }

            var self = this;
            var entity = collection[index];

            $.when(localDB.find(collectionName, { id: entity.id }))
            .then(function(results) {
                if (results.length == 1) {
                    $.when(localDB.remove(collectionName, { id: entity.id }, entity))
                    .then(function() {
                        self._removeCollectionRec(collectionName, collection, ++index, dfd);
                    })
                    .fail(function(err) {
                        console.error('[Sync] - Unable to replace entity: ' + entity.id);
                        self._removeCollectionRec(collectionName, collection, ++index, dfd);
                    });
                } else {
                    self._removeCollectionRec(collectionName, collection, ++index, dfd);
                }
            })
            .fail(function(err) {
                console.error(err);
                dfd.reject(err);
            });

            return dfd.promise();
        },

        _getSettings: function(driver) {
            var dfd = $.Deferred();

            //var url = SERVER_ROOT + "adapters/SettingsAdapter/v1/settings"
            var url = "data/settings.json";
            console.log("Calling: " + url);

            $.when(this._ajaxGet(url, driver))
            .then(function(data) {
                dfd.resolve(data.settings);
            })
            .fail(function(err) {
                dfd.reject(err);
            });

            return dfd.promise();
        },

        _saveSettings: function(settings) {
            return this._replaceCollection(DSV.constants.DSVSettings, settings);
        },

        _getDeviations: function(driver) {
            var dfd = $.Deferred();

            //var url = SERVER_ROOT + "adapters/DeviationsAdapter/v1/deviations"
            var url = "data/deviations.json";
            console.log("Calling: " + url);

            $.when(this._ajaxGet(url, driver))
            .then(function(data) {
                dfd.resolve(data.deviations);
            })
            .fail(function(err) {
                dfd.reject(err);
            });

            return dfd.promise();
        },

        _saveDeviations: function(deviations) {
            return this._replaceCollection(DSV.constants.DSVDeviations, deviations);
        },

        _replaceCollection: function(collectionName, collection) {
            var dfd = $.Deferred();
            var self = this;

            $.when(localDB.init(collectionName, { searchFields: DSV.searchFields[collectionName] }))
            .then(function() {
                $.when(localDB.removeCollection(collectionName))
                .then(function() {
                    localDB.closeAll();

                    $.when(self.saveCollectionAsync(collectionName, collection))
                    .then(function() {
                        dfd.resolve();
                    })
                    .fail(function(err) {
                        console.error(err);
                        localDB.closeAll();
                        dfd.reject(err);
                    });
                });
            })
            .fail(function(err) {
                console.error(err);
                localDB.closeAll();
                dfd.reject(err);
            });

            return dfd.promise();
        },

        _getLanguages: function(driver) {
            var dfd = $.Deferred();

            //var url = SERVER_ROOT + "adapters/LanguagesAdapter/v1/languages"
            var url = "data/languages.json";
            console.log("Calling: " + url);

            $.when(this._ajaxGet(url, driver))
            .then(function(data) {
                dfd.resolve(data.languages);
            })
            .fail(function(err) {
                dfd.reject(err);
            });

            return dfd.promise();
        },

        _saveLanguages: function(languages) {
            var dfd = $.Deferred();
            var self = this;

            $.when(localDB.init(DSV.constants.DSVLanguages, { searchFields: DSV.searchFields[DSV.constants.DSVLanguages] }))
            .then(function() {
                $.when(localDB.find(DSV.constants.DSVLanguages))
                .then(function(results) {
                    if (results.length == 0) {
                        $.when(self.saveCollectionAsync(DSV.constants.DSVLanguages, languages))
                        .then(function() {
                            localDB.closeAll();
                            $.each(languages, function(j, lang) {
                                if (lang.isSelected) 
                                    DSV.constants.messages = lang.messages;
                            });

                            dfd.resolve();
                        })
                        .fail(function(err) {
                            console.error(err);
                            localDB.closeAll();
                            dfd.reject(err);
                        });
                    } else {
                        localDB.closeAll();
                        results = self.clearDBResults(results);

                        // update the messages only (isSelected is user's option)
                        $.each(results, function(i, res) {
                            $.each(languages, function(j, lang) {
                                if (res.value == lang.value) {
                                    res.messages = lang.messages;

                                    if (res.isSelected) // if a language is selected locally, update it
                                        DSV.constants.messages = lang.messages;
                                }
                            });
                        });

                        $.when(self._replaceCollection(DSV.constants.DSVLanguages, results))
                        .then(function() {
                            dfd.resolve();
                        })
                        .fail(function(err) {
                            console.error(err);
                            localDB.closeAll();
                            dfd.reject(err);
                        });
                    }
                });
            })
            .fail(function(err) {
                console.error(err);
                localDB.closeAll();
                dfd.reject(err);
            });

            return dfd.promise();
        },

        _ajaxGet: function(url, driver) {
            var dfd = $.Deferred();

            if (device.isOnline() == false) {
                console.warn('[Sync/_ajaxGet] - Device is offline. Url: ' + url);
                dfd.reject();
                return dfd.promise();
            }

            $.ajax({
                type: "GET",
                contentType: "application/json",
                dataType: "json",
                timeout: 20000,
                async: true,
                cache: false,
                url: url,
                beforeSend: function(xhr) {
                    xhr.setRequestHeader("Authorization", "Basic " + btoa(driver.username + ":" + driver.token));
                }
            })
            .done(function(data) {
                dfd.resolve(data);
            })
            .fail(function(xhr, textStatus) {
                var text = "HTTP Error: " + xhr.status + "(" + textStatus + ")";
                console.error('[Sync/_ajaxGet] - ' + text);
                //$logger.log('Error on checkCredentials: ' + text);
                dfd.reject({message: text, code: xhr.status});
            });

            return dfd.promise();
        },

        syncPosition: function(positionUrl, driver) {
            var dfd = $.Deferred();

            if (device.isOnline() == false) {
                console.warn('[Sync/syncPosition] - Device is offline.');
                dfd.reject();
                return dfd.promise();
            }

			$.ajax({
                type: "POST",
                contentType: "*/*",
                timeout: 10000,
                cache: false,
                async: true,
                url: positionUrl,
                beforeSend: function(xhr) {
                    xhr.setRequestHeader("Authorization", "Basic " + btoa(driver.username + ":" + driver.token));
                }
            })
            .done(function(data) {
            	dfd.resolve();
            })
            .fail(function(xhr, error) {
            	dfd.reject();
            });

            return dfd.promise();
		},
    };
});
