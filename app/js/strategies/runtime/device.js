/**
 * 
 */
define(["js/strategies/runtime/cordovaRuntime", "js/strategies/runtime/windowsMobileRuntime"], function(cordovaRuntime, wmRuntime) {
	return {
		_barcodeCallbacks: [],
		
		_getRuntime: function() {
			if (typeof Rho !== "undefined") {
				return wmRuntime;
			}
			
			return cordovaRuntime;
		},
		
		getPicture: function(success, fail, options) {
			this._getRuntime().getPicture(success, fail, options);
		},
		
		scanBarcode: function(success, fail, options) {
			this._getRuntime().scanBarcode(success, fail, options);
		},
		
		stopScanBarcode: function(success, fail, options) {
			this._getRuntime().stopScanBarcode(success, fail, options);
		},
		
		captureAudio: function(success, fail, options) {
			this._getRuntime().captureAudio(success, fail, options);
		},
		
		captureVideo: function(success, fail, options) {
			this._getRuntime().captureVideo(success, fail, options);
		},
		
		capturePosition: function(success, fail) {
			this._getRuntime().capturePosition(success, fail);
		},
		
		playVideo: function(path) {
			this._getRuntime().playVideo(path);
		},
		
		restart: function() {
			this._getRuntime().restart();
		},
		
		writeFile: function(path, data, callback) {
			this._getRuntime().writeFile(path, data, callback);
		},
		
		log: function(text, level) {
			this._getRuntime().log(text, level);
		},
		
		getCellConnectivity: function(callback) {
            this._getRuntime().getCellConnectivity(callback);
		},
		
		getWifiConnectivity: function(callback) {
			this._getRuntime().getWifiConnectivity(callback);
		},
		
		getTime: function() {
			var date = new Date();
			var minutes = date.getMinutes();
			var hours = date.getHours();
			return hours + ":" + (minutes < 10 ? "0"+minutes : minutes);
		},
		
		isPositionAvailable: function(success) {
			return this._getRuntime().isPositionAvailable(success);
		},
		
		getBatteryLevel: function(success) {
			return this._getRuntime().getBatteryLevel(success);
		},
		
		addBarcodeCallback: function(success) {
			this._barcodeCallbacks.push(success);
		},
		
		removeBarcodeCallback: function() {
			if (this._barcodeCallbacks.length > 0) {
				this._barcodeCallbacks.pop();
			}
		},
		
		onBarcodeScaned: function(data) {
			if (this._barcodeCallbacks.length > 0) {
				var callback = this._barcodeCallbacks[this._barcodeCallbacks.length - 1];
				if (callback && Object.prototype.toString.call(callback) == '[object Function]')
					callback(data);
			}
		},		
		
		closeApplication: function() {
            this._getRuntime().closeApplication();
		},
        
        beep: function() {
            this._getRuntime().beep({});
        },
        
        isOnline: function() {
            return this._getRuntime().isOnline();
        }
	};
});