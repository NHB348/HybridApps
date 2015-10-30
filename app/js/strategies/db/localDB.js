/*
 * localDB Adapter implementation using WL JSON Store (it is not the same as WL Server Adapters).
 * Has a reference to WL JSON Store Adaptee. 
 */

define(["js/strategies/db/clients/WLJSONStore", "js/strategies/db/clients/RhoDatabase"],
	 function(jsonStoreImpl, rhoStoreImpl) { 
		function _getDBImpl() {
			if (typeof Rho != "undefined") {
				return rhoStoreImpl;
			}
			
			return jsonStoreImpl;
		};
		
		return {
			init: function(collections, initOptions) {
				return _getDBImpl().init(collections, initOptions);
			},
			
			get: function(collectionName) {
				return _getDBImpl().get(collectionName);
			},
			
			find: function(collectionName, jsonObj, options) {
				return _getDBImpl().find(collectionName, jsonObj, options);
			},
			
			add: function(collectionName, data, options) {
				if (data.$$hashKey)
					delete data.$$hashKey;
				if (data.selected)
					delete data.selected;
                if (data.toBeImported)
                    delete data.toBeImported;
				
				return _getDBImpl().add(collectionName, data, options);
			},
			
			replace: function(collectionName, conditionObj, data, options) {
				if (data.$$hashKey)
					delete data.$$hashKey;
				if (data.selected)
					delete data.selected;
                if (data.toBeImported)
                    delete data.toBeImported;
				
				return _getDBImpl().replace(collectionName, conditionObj, data, options);
			},
            
            remove: function(collectionName, doc, options) {
                return _getDBImpl().remove(collectionName, doc, options);
            },
			
			destroy: function() {
				return _getDBImpl().destroy();
			},
			
			closeAll: function() {
				return _getDBImpl().closeAll();
			},
			
			removeCollection: function(collectionName) {
				return _getDBImpl().removeCollection(collectionName);
			}
		};
});