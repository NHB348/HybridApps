define([], function() { 
	return {
		
		init: function(collectionName, initOptions) {
			
			console.log('[WLJSONStore/init] - Init collection: ' + collectionName + "...");
			//Object that defines all the collections
			var collections = {};

			//Object that defines the 'collectionName' collection
			collections[collectionName] = {};

			//Object that defines the Search Fields for the 'collectionName' collection
			if (initOptions && initOptions.searchFields)
				collections[collectionName].searchFields = initOptions.searchFields;
			
			//Optional options object
			var options = {};
			if (initOptions && initOptions.username)
				options.username = initOptions.username;
			else
				options.username = APP_NAME;
			
			if (initOptions && initOptions.password)
				options.password = initOptions.password;
			else 
				options.password = 'w0rklight';
			
			options.localKeyGen = true;
			
			return WL.JSONStore.init(collections, options); // returns promise;
		},
			
		add: function(collectionName, data, options) {
			var dfd = $.Deferred();
			
			var collection = this.get(collectionName);
            
            if (collection == undefined) {
            	console.warn("[WLJSONStore/add] - Collection '" + collectionName + "' does not exist");
            	dfd.reject();
            } else {
            	collection.add(data, options)
            		.then(function() {
            			console.log("[WLJSONStore/add] - Data successfully added to '" + collectionName + "'...");
            			dfd.resolve();
            		})
            		.fail(function() {
            			console.error("[WLJSONStore/add] - Adding data failed for '" + collectionName + "'...");
            			dfd.reject();
            		});
            }
            
            return dfd.promise();
		},
		
		get: function(collectionName) {
			return WL.JSONStore.get(collectionName); // returns promise;
		},
		
		find: function(collectionName, jsonObj, options) {
			var dfd = $.Deferred();
				
			var collection = this.get(collectionName);
			if (collection == undefined) {
				console.warn("[WLJSONStore/find] - Collection '" + collectionName + "' does not exist or init(...) was not called!");
				dfd.reject();
			} else {
				if (jsonObj == undefined) {
					collection.findAll(options)
					.then(function(arrayResults) { dfd.resolve(arrayResults); })
					.fail(function(errorObject) { dfd.reject(errorObject); });
				} else {
					collection.find(jsonObj, options)
						.then(function(arrayResults) { dfd.resolve(arrayResults); })
						.fail(function(errorObject) { dfd.reject(errorObject); });
				}
			}
			
			return dfd.promise();
		},
		
		replace: function(collectionName, conditionObj, data, options) {
			var dfd = $.Deferred();
			
			var collection = this.get(collectionName);
			if (collection == undefined) {
            	dfd.reject("[WLJSONStore/replace] - Collection '" + collectionName + "' does not exist");
            } else {
				$.when(this.find(collectionName, conditionObj, options))
				.then(function(arrayResults) {
					if (arrayResults.length == 0) {
						dfd.reject("[WLJSONStore/replace] - Unable to find in collection: " + collectionName);
					} else {
						if (arrayResults.length == 1) {
							var jsonStored = arrayResults[0];
							jsonStored.json = data;
							$.when(collection.replace(jsonStored, options))
							.then(function() {
								dfd.resolve();
							})
							.fail(function(err) {
								dfd.reject(err);
							});
						} else {
							dfd.reject("[WLJSONStore/replace] - Too many objects are having the same data.");
						}
					}
				})
				.fail(function(err) {
					dfd.reject(err);
				});
            }
			
			return dfd.promise();
		},
		
		destroy: function() {
			return WL.JSONStore.destroy(); // returns promise;
		},
        
        remove: function(collectionName, doc, options) {
            var dfd = $.Deferred();
            
            var collection = this.get(collectionName);
			if (collection == undefined) {
            	dfd.reject("[WLJSONStore/remove] - Collection '" + collectionName + "' does not exist");
            } else {
				$.when(this.find(collectionName, {id: doc.id}, options))
				.then(function(arrayResults) {
					if (arrayResults.length == 0) {
						dfd.reject("[WLJSONStore/remove] - Unable to find in collection: " + collectionName);
					} else {
						if (arrayResults.length == 1) {
							var jsonStored = arrayResults[0];
                            
							$.when(collection.remove(jsonStored, options))
							.then(function() {
								dfd.resolve();
							})
							.fail(function(err) {
								dfd.reject(err);
							});
						} else {
							dfd.reject("[WLJSONStore/remove] - Too many objects are having the same data.");
						}
					}
				})
				.fail(function(err) {
					dfd.reject(err);
				});
            }
            
            return dfd.promise();
        },
		
		closeAll: function() {
			console.log("[WLJSONStore/closeAll] - Close collections!");
			return WL.JSONStore.closeAll(); // returns promise;
		},
			
		removeCollection: function(collectionName) {
			var dfd = $.Deferred();
		
			console.log("[WLJSONStore/removeCollection] - removeCollection: " + collectionName);
			var collection = this.get(collectionName);
            
            if (collection == undefined) {
            	console.warn("[WLJSONStore/removeCollection] - Collection '" + collectionName + "' does not exist");
            	dfd.resolve();
            } else {
            	collection.removeCollection()
            		.then(function() { dfd.resolve(); })
            		.fail(function() { dfd.reject(); });
            }
            
            return dfd.promise();
		}
	};
});