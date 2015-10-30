define([], function() {
	return {
		logError: function(text) {
			Rho.Log.error("["+ (new Date()).toLocaleString() + "] - ERROR : " + text + "\r\n");
		},
		
		logWarning: function(text) {
			Rho.Log.warning("["+ (new Date()).toLocaleString() + "] - WARN : " + text + "\r\n");
		},
		
		log: function(text) {
			Rho.Log.info("["+ (new Date()).toLocaleString() + "] - NORMAL : " + text + "\r\n");
		}
	};
});