
(function () {
    'use strict';

    define(['sync'], function (sync) {

        LoginService.$inject = ['$q'];

        function LoginService($q) {
            this.login = function(username, password) {
            	var dfd = $q.defer();
                var self = this;
            	
            	var url = SERVER_ROOT + "adapters/SecurityAdapter/v1/login"
            	console.log("Calling: " + url);
            	
            	$.ajax({
                    type: "POST",
                    contentType: "application/json",
                    dataType: "json",
                    timeout: 20000,
                    async: true,
                    cache: false,
                    url: url,
                    beforeSend: function(xhr) {
                    	xhr.setRequestHeader("Authorization", "Basic " + btoa(username + ":" + password));
                    }
                })
                .done(function(data) {
                    DSV.constants.lastConnectionTime = new Date();
                    dfd.resolve(data);
                })
                .fail(function(xhr, textStatus) {
                    var text = "HTTP Error: " + xhr.status + "(" + textStatus + ")";
                    console.error('[LoginService/login] - ' + text);
                    dfd.reject({message: text, code: xhr.status});
                });

            	
            	return dfd.promise;
            };
            
            this.logout = function(driver) {
            	var dfd = $q.defer();
            	
            	var url = SERVER_ROOT + "adapters/SecurityAdapter/v1/logout"
            	console.log("Calling: " + url);
            	
            	$.ajax({
                    type: "POST",
                    contentType: "application/json",
                    timeout: 20000,
                    async: true,
                    cache: false,
                    url: url,
                    data: JSON.stringify({ "vehicleId": driver.vehicle }),
                    beforeSend: function(xhr) {
                    	xhr.setRequestHeader("Authorization", "Basic " + btoa(driver.username + ":" + driver.token));
                    }
                })
                .done(function(data) {
                    dfd.resolve(data);
                })
                .fail(function(xhr, textStatus) {
                    var text = "HTTP Error: " + xhr.status + "(" + textStatus + ")";
                    console.error('[LoginService/logout] - ' + text);
                    dfd.reject({message: text, code: xhr.status});
                });

            	
            	return dfd.promise;
            };
            
            this.searchVehicles = function(driver) {
            	var dfd = $q.defer();
            	
            	var url = SERVER_ROOT + "adapters/SecurityAdapter/v1/vehicle"
            	console.log("Calling: " + url);
            	
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
                    DSV.constants.lastConnectionTime = new Date();
                    dfd.resolve(data);
                })
                .fail(function(xhr, textStatus) {
                    var text = "HTTP Error: " + xhr.status + "(" + textStatus + ")";
                    console.error('[LoginService/searchVehicles] - ' + text);
                    dfd.reject({message: text, code: xhr.status});
                });

            	
            	return dfd.promise;
            };
   
            this.selectOrDeselectVehicle = function(driver, isSelect) {
            	var dfd = $q.defer();
            	
            	var url = SERVER_ROOT + "adapters/SecurityAdapter/v1/vehicle?vehicleId=" + driver.vehicle + "&isSelect=" + isSelect;
            	console.log("Calling: " + url);
            	
            	$.ajax({
                    type: "POST",
                    contentType: "application/json",
                    timeout: 20000,
                    async: true,
                    cache: false,
                    url: url,
                    beforeSend: function(xhr) {
                    	xhr.setRequestHeader("Authorization", "Basic " + btoa(driver.username + ":" + driver.token));
                    }
                })
                .done(function(data) {
                    DSV.constants.lastConnectionTime = new Date();
                    dfd.resolve(data);
                })
                .fail(function(xhr, textStatus) {
                    var text = "HTTP Error: " + xhr.status + "(" + textStatus + ")";
                    console.error('[LoginService/selectOrDeselectVehicle] - ' + text);
                    dfd.reject({message: text, code: xhr.status});
                });

            	
            	return dfd.promise;
            };
            
            this.setDataTransport = function(driver) {
            	var dfd = $q.defer();
            	
            	var url = SERVER_ROOT + "adapters/SecurityAdapter/v1/transport";
            	console.log("Calling: " + url);
            	
            	var bodyData;
            	if(driver.isTransport){
            		bodyData = JSON.stringify({ "transport": driver.isTransport, "transportRouteId" : driver.transportRoute });
            	}
            	else {
            		bodyData = JSON.stringify({ "transport": driver.isTransport, "transportRouteId" : driver.transportRoute, "routeDate" : driver.routeDate });
            	}
            	
            	$.ajax({
                    type: "POST",
                    contentType: "application/json",
                    timeout: 20000,
                    async: true,
                    cache: false,
                    url: url,
                    data: bodyData,
                    beforeSend: function(xhr) {
                    	xhr.setRequestHeader("Authorization", "Basic " + btoa(driver.username + ":" + driver.token));
                    }
                })
                .done(function(data) {
                    // get the first data = settings + languages + deviations + cancel causes
                    $.when(sync.syncUserData(driver))
                    .then(function() {
                        DSV.constants.lastConnectionTime = new Date();
                        
                        dfd.resolve();
                    }).fail(function() {
                        dfd.resolve();
                    });
                })
                .fail(function(xhr, textStatus) {
                    var text = "HTTP Error: " + xhr.status + "(" + textStatus + ")";
                    console.error('[LoginService/setDataTransport] - ' + text);
                    dfd.reject({message: text, code: xhr.status, name: xhr.responseText});
                });

            	return dfd.promise;
            };
            
            this.dummyLogin = function() {
                var dfd = $.Deferred();
                
                $.when(sync.syncUserData(DSV.driver))
                .then(function() {
                    DSV.constants.lastConnectionTime = new Date();

                    $.when(sync.syncTransportData())
                    .then(function() {
                        dfd.resolve();
                    });
                }).fail(function() {
                  dfd.resolve(data);
                });    
                
                return dfd.promise();
            };
        }
        return LoginService;
    });
})();