if (typeof Rho !== 'undefined') { // only for Rho runtime
    // Rho 2.2 Image/Camera API
    DSV.__imageData = '';
    function onPictureCaptured(picData) {
    	DSV.__imageData = picData.imageData;
    	imager.disable();
    }
    
    // Rho 2.2 AudioCapture API
    var audioData = '';
    function onAudioCaptured(data) {
    	alert(JSON.stringify(data));
    	audioData = data;
    	audioCapture.stop();
    }
	
	function onBarcodeScaned(jsonObject) {
		try {
			var device = require('device');
			device.onBarcodeScaned(jsonObject);
		} catch (e) {
			console.error('onBarcodeScaned - ' + e);
		}
    }
}