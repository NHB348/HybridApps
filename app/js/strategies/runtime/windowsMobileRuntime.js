
define(['./logger/rhoFileLogger'], function(logger) {
	return {		
		getPicture: function(success, fail, options) {
			if (success == undefined) {
				fail("WM Runtime getPicture - Success callback is undefined");
				return;
			}
			
			options = options || { };
			
			Rho.Camera.takePicture(options, success);
            return;

			imager.enable();
			imager.left = 40;
			imager.top = 40;
			imager.height = 640 - 40 - 70;
			imager.width =  480 - 40 - 40;
			imager.capture();

			var pictureInterval = setInterval(function() {
				if (DSV.__imageData && DSV.__imageData != '') {
					success(DSV.__imageData);
					DSV.__imageData = null;
					clearInterval(pictureInterval);
				}
			}, 500);
		},
		
		scanBarcode: function(success, fail, options) {
			if (success == undefined) {
				console.error("WM Runtime scanBarcode - Success callback is undefined");
				return;
			}
			
			Rho.Barcode.take({}, success);
		},
		
		stopScanBarcode: function(success, fail, options) {
			Rho.Barcode.stop();
		},
		
		captureAudio: function(success, fail, options) {
			if (options && options.limit)
				audioCapture.duration = options.limit;
			else
				audioCapture.duration = 5000;
			
			audioCapture.start();
			
			var audioInterval = setInterval(function() {
				if (audioData && audioData != '') {
					success([audioData]);
					audioData = '';
					clearInterval(audioInterval);
				}
			}, 500);
		},
		
		captureVideo: function(success, fail, options) {
			videoCapture.videoSaveEvent = 'videoSaved(%json)'; // check Rho for video
			videoCapture.start();
		},
		
		capturePosition: function(success, fail) {
			if (success == undefined || fail == undefined) {
				console.error("WM Runtime capturePosition - Success/fail callback is undefined");
				return;
			}
			
			if (Rho.GeoLocation == undefined && Rho.Geolocation == undefined) {
				fail({ message: "GeoLocation not available." });
				return;
			}
			
			if (Rho.GeoLocation.is_known_position()) {
				success({ 
					coords: { 
						latitude: Rho.GeoLocation.latitude(), 
						longitude: Rho.GeoLocation.longitude()
					} 
				});
				return;
			}
			
			 Rho.GeoLocation.set_notification(function(res) {
				if (Rho.GeoLocation.is_known_position()) {
					//res.altitude; res.speed - are avaialble
				 	success({ 
								coords: { 
									latitude: res.latitude, 
									longitude: res.longitude
								} 
							});
				}
			 }, "", 10000);
		},
		
		playVideo: function(path) {
			path = "\\DSVMobile\\" + path.replace('/', '\\');
			generic.LaunchProcessNonBlocking("\\Windows\\WMPlayer.exe", path);
		},
		
		restart: function() {
			// start
			generic.LaunchProcessNonBlocking("\\Program Files\\DSV Driver\\DSV Driver.exe");
			
			// exit
			Rho.Application.quit();
		},
		
		writeFile: function(path, data, callback) {
		    console.log('[WM Runtime] - Writing file: ' + path);
		
			var file = new Rho.RhoFile(path, Rho.RhoFile.OPEN_FOR_WRITE);
			file.write(data);
			file.flush();
			file.close();
			console.log("[WM Runtime] - File updated!");
			
			callback();
		},
		
		log: function(text, level) {
			if (!level || level == "log" || level == "debug") {
				logger.log(text);
			} 
			
			if (level == "warning") {
				logger.logWarning(text);
			}
			
			if (level == "error") {
				logger.logError(text);
			}
		},
		
		getCellConnectivity: function(callback) {
			return Rho.Network.connectWan("Internet", callback);
		},
		
		getWifiConnectivity: function(callback) {
			return Rho.SignalIndicators.wlanStatus(callback);
		},
		
		isPositionAvailable: function(success) {
			if (success == undefined) {
				console.error("WM Runtime isPositionAvailable - Success callback is undefined");
				return;
			}
			
			if (Rho.GeoLocation.is_known_position()) {
				success(true);
				return;
			}
			
			Rho.GeoLocation.set_notification(function(res) {
				Rho.GeoLocation.turnoff();
				success(res.known_position == true);
			 }, "", 10000);
		},
		
		getBatteryLevel: function(success) {
			Rho.Battery.batteryStatus({}, function(params) {
				if (params.batteryLifePercent) {
					success(params.batteryLifePercent); // 0-100
				}
			});
		},		
		
		closeApplication: function() {
            Rho.Application.quit();
		},
		
        beep: function() {
            Rho.Notification.beep();
        },
        
        isOnline: function() {
            return Rho.Network.hasNetwork();
        }
	};
});