/**
 * 
 */
define(['./logger/cordovaFileLogger'], function(logger) {
	return {		
		getPicture: function(success, fail, options) {
			if (success == undefined || fail == undefined) {
				console.error("WM Runtime getPicture - Success/Fail callbacks(s) undefined");
				return;
			}
			
			navigator.camera.getPicture(success, fail, options);
		},
		
		scanBarcode: function(success, fail, options) {
			if (success == undefined || fail == undefined) {
				console.error("WM Runtime scanBarcode - Success/Fail callbacks(s) undefined");
				return;
			}
			
			var scanner = new BarcodeScanner();
        	scanner.scan(success, fail);
		},
		
		stopScanBarcode: function(success, fail, options) {
			
		},
		
		captureAudio: function(success, fail, options) {
			if (success == undefined || fail == undefined) {
				console.error("WM Runtime captureAudio - Success/Fail callbacks(s) undefined");
				return;
			}
			
			navigator.device.capture.captureAudio(success, fail, options);
		},
		
		captureVideo: function(success, fail, options) {
			if (success == undefined || fail == undefined) {
				console.error("WM Runtime captureVideo - Success/Fail callbacks(s) undefined");
				return;
			}
			
			navigator.device.capture.captureVideo(success, fail, options);
		},
		
		capturePosition: function(success, fail) {
			if (success == undefined || fail == undefined) {
				console.error("WM Runtime capturePosition - Success/Fail callbacks(s) undefined");
				return;
			}
			
			navigator.geolocation.getCurrentPosition(success, fail,{
				  enableHighAccuracy: true,
				  timeout: 7000,
				  maximumAge: 0
			});
		},
		
		playVideo: function(path) {
			VideoPlayer.play('file:///android_asset/www/default/' + path);
		},
		
		restart: function() {
			// start
			
			
			// exit
			if (!navigator || !navigator.app || !navigator.app.exitApp) {
				//window.location = window.location;
			} else {
				//navigator.app.exitApp();
			}
		},
		
		writeFile: function(path, data, callback) {
			path = 'file:///android_asset/www/default/' + path;
			
			function gotFS(fileSystem) {
				console.log('getting file: ' + path);
		        fileSystem.root.getFile(path, {create: true, exclusive: false}, gotFileEntry, fail);
		    }
		
		    function gotFileEntry(fileEntry) {
				console.log('got File');
		        fileEntry.createWriter(gotFileWriter, fail);
		    }
		
		    function gotFileWriter(writer) {
				console.log('got File writer');
		        writer.onwriteend = function(evt) {
		            callback();
		        };
		        writer.write(data);
		    }
		
		    function fail(error) {
		        console.log("FS Error:" + error.code);
				callback();
		    }
			
			window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, gotFS, fail);
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
		
		closeApplication: function() {
			WL.App.close();
		},
		
        beep: function() {
            navigator.notification.beep();
        },
        
        isOnline: function() {
            if (navigator.onLine)
                return navigator.onLine;
            
            return navigator.connection.type != Connection.NONE;
        }
	};
});


