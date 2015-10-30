(function () {
    'use strict';

    define([], function () {

        ReceiversService.$inject = ['LocalDBService', 'UtilsService'];

        function ReceiversService(localDBService, utilsService) {
      
        	  
            this.loadReceivers = function() {
                var dfd = $.Deferred();
                
        		$.when(localDBService.init(DSV.constants.DSVReceivers, { searchFields: DSV.searchFields[DSV.constants.DSVReceivers] }))
        		.then(function(){
        			$.when(localDBService.find(DSV.constants.DSVReceivers))
        			.then(function(receivers){
                        localDBService.closeAll();
                        
                        dfd.resolve(receivers);
        			})
        			.fail(function(err) {
        				localDBService.closeAll();
                        dfd.resolve(DSV.constants.DSVReceivers);
        			});
        		});
        		
        		return dfd.promise();
            };
            
            this.getReceiversByCity = function(city) {
                var dfd = $.Deferred();
                
        		$.when(localDBService.init(DSV.constants.DSVReceivers, { searchFields: DSV.searchFields[DSV.constants.DSVReceivers] }))
        		.then(function(){
        			$.when(localDBService.find(DSV.constants.DSVReceivers, {city: receiver.city}))
        			.then(function(receivers){
                        localDBService.closeAll();
                        
                        dfd.resolve(receivers);
        			})
        			.fail(function(err) {
        				localDBService.closeAll();
                        dfd.resolve(DSV.constants.DSVReceivers);
        			});
        		});
        		
        		return dfd.promise();
            };
            
            
            
            this.saveReceiver = function(receiver) {
                var dfd = $.Deferred();

            	$.when(localDBService.init(DSV.constants.DSVReceivers, { searchFields: DSV.searchFields[DSV.constants.DSVReceivers] }))
                .then(function() {
	            	$.when(localDBService.find(DSV.constants.DSVReceivers, {name: receiver.name, city: receiver.city}))
	                .then(function(results) {
	               
	                    if (results.length == 1) {
	                    	$.when(localDBService.replace(DSV.constants.DSVReceivers, {name: receiver.name, city: receiver.city}, receiver))
	                    	.then(function() {
                                localDBService.closeAll();
	                    		dfd.resolve();
	                    	})
	                    	.fail(function(err) {
                                localDBService.closeAll();
	                    		console.error('[ReceiversService/saveReceiver] - Error: ' + receiver.name);
	                    		dfd.reject(err);
	                    	});
	                    } else {
                            if (results.length == 0) {
                                $.when(localDBService.add(DSV.constants.DSVReceivers, receiver))
                                .then(function() {
                                    localDBService.closeAll();
                                    dfd.resolve();
                                })
                                .fail(function(err) {
                                    localDBService.closeAll();
                                    console.error('[ReceiversService/saveReceiver] - Error: ' + receiver.name);
                                    dfd.reject(err);
                                });
                            } else {
                                localDBService.closeAll();
                                console.error('[ReceiversService/saveReceiver] - Found multiple receivers: ' + receiver.name);
                                dfd.reject('Found multiple receivers: ' + receiver.name);
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
            
            
            
            
            
        }
        return ReceiversService;
    });
})();