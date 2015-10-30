define([], function() { 
	return { 
		
		_db: null,
		
		init: function(collectionName, initOptions) {
			var dfd = $.Deferred();
			
			if (this._db == null) {
				var path = Rho.Application.databaseFilePath(APP_NAME);
				console.log('[RhoDatabase/init] - creating DB: ' + path);
				this._db = new Rho.Database(path, APP_NAME);
			}
			
			dfd.resolve();
			
			return dfd.promise();
		},	
		
		add: function(collectionName, data, options) {
			var dfd = $.Deferred();
			
			$.when(this.get(collectionName))
			.then(function(model) {
				console.log('[RhoDatabase/add] - Add to: ' + collectionName);
				model.create(data);
				
				dfd.resolve();
			})
			.fail(function(err) {
				dfd.reject(err);
			});
			
			return dfd.promise();
		},
		
		// returns an empty memory model or an existing one
		get: function(collectionName) { 
			var dfd = $.Deferred();
			
			if (this._db != null) {
				var model = Rho.ORM.getModel(collectionName);
				if (!model) {
					console.log('[RhoDatabase/get] - Creating model: ' + collectionName);
					model = Rho.ORM.addModel(collectionName, function(m) { });
				}
			
				dfd.resolve(model);
			} else {
				dfd.reject('[RhoDatabase/get] - no DB instance!');
			}
			
			return dfd.promise();
		},
		
		// finds all objects in a collection given the jsonObj conditions
		find: function(collectionName, jsonObj, options) {
			var dfd = $.Deferred();
			
			console.log('[RhoDatabase/find] - Find in "' + collectionName + '" for ' + JSON.stringify(jsonObj));
			$.when(this.get(collectionName))
			.then(function(model) {
				if (jsonObj == undefined) {
					dfd.resolve(model.find('all'));
				} else {
					var results = model.find('all', {
						conditions: jsonObj
					});
					
					dfd.resolve(results); // results is an array of object<model>
				}
			})
			.fail(function(err) {
				dfd.reject(err);
			});
			
			return dfd.promise();
		},
		
		replace: function(collectionName, conditionObj, data, options) {
			var dfd = $.Deferred();
			var that = this;
			
			console.log('[RhoDatabase/replace] - Replace in "' + collectionName + '" for ' + JSON.stringify(conditionObj));
			$.when(this.find(collectionName, conditionObj, options))
			.then(function(models) {
				if (models.length == 0) {
					dfd.reject("[RhoDatabase/replace] - Unable to find in collection: " + collectionName);
				} else if (models.length == 1) {
					var model = models[0];
					model.destroy();
					
					$.when(that.add(collectionName, data, options))
					.then(function() {
						dfd.resolve();
					})
					.fail(function(err) {
						dfd.reject(err);
					});
				} else {
					dfd.reject("Too many objects are having the same data.");
				}
			})
			.fail(function(err) {
				dfd.reject(err);
			});
			
			return dfd.promise();
		},
		
		/*replace: function(collectionName, data, options) { // needs to use find, not get
			var dfd = $.Deferred();
			
			$.when(this.get(collectionName))
			.then(function(model) {
				for (var prop in data) {
					model[prop] = data[prop];
				}
				model.save();
				
				dfd.resolve();
			})
			.fail(function(err) {
				dfd.reject(err);
			});
			
			return dfd.promise();
		},*/
		
		destroy: function() {
			var dfd = $.Deferred();
			
			if (this._db != null) {
				this._db.destroyTables({include: [], exclude: []});
				console.log('[RhoDatabase] - Destroy all tables!');
				dfd.resolve();
			} else {
				dfd.reject();
			}
			
			return dfd.promise();
		},
        
        remove: function(collectionName, doc, options) {
            var dfd = $.Deferred();
            
            if (this._db != null) {
                $.when(this.find(collectionName, {id: doc.id}, options))
                .then(function(models) {
                    if (models.length == 0) {
                        dfd.reject("[RhoDatabase/remove] - Unable to find in collection: " + collectionName);
                    } else if (models.length == 1) {
                        var model = models[0];
                        model.destroy();
                
                        console.log('[RhoDatabase] - Destroy document!');
                        dfd.resolve();
                    } else {
                        dfd.reject("Too many objects are having the same data.");
                    }
                })
                .fail(function(err) {
                    dfd.reject(err);
                });
			} else {
				dfd.reject();
			}
            
            return dfd.promise();
        },
		
		closeAll: function() {
			var dfd = $.Deferred();
			
			if (this._db != null) {
				console.log('[RhoDatabase] - Close DB!');
				this._db.close();
				this._db = null;
				dfd.resolve();
			} else {
				dfd.reject();
			}
			
			return dfd.promise();
		},
		
		removeCollection: function(collectionName) {
			var dfd = $.Deferred();
			console.log('[RhoDatabase] - Remove collection: ' + collectionName);
			
			var model = Rho.ORM.getModel(collectionName);
			if (model) {
                model.deleteAll();
            }
            
            dfd.resolve();
			
            return dfd.promise();
		}		
	};
});