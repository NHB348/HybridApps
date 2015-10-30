(function () {
    'use strict';

    define(['localDB'], function (localDB) {

        LocalDBService.$inject = [];

        function LocalDBService() {
        	this.init = function(collections, initOptions) {
				return localDB.init(collections, initOptions);
			};
			
			this.get = function(collectionName) {
				return localDB.get(collectionName);
			};
			
			this.find = function(collectionName, jsonObj, options) {
				return localDB.find(collectionName, jsonObj, options);
			};
			
			this.add = function(collectionName, data, options) {
				return localDB.add(collectionName, data, options);
			};
			
			this.replace = function(collectionName, conditionObj, data, options) {
				return localDB.replace(collectionName, conditionObj, data, options);
			};
			
			this.destroy = function() {
				return localDB.destroy();
			};
            
            this.remove = function(collectionName, doc, options) {
				return localDB.remove(collectionName, doc, options);
			};
			
			this.closeAll = function() {
				return localDB.closeAll();
			};
			
			this.removeCollection = function(collectionName) {
				return localDB.removeCollection(collectionName);
			};
        }
        return LocalDBService;
    });
})();