define(["device"], function(device) {
	return {
		__bateryClass: '',
		
		checkConnections: function() {
			try {
				$('#timeDiv').text(device.getTime());
				
                device.getCellConnectivity(function(data) {
                    if (data && data.phoneSignalStrength > 0) {
                        $('#cellularDiv i').removeClass('fa-circle-o').addClass('fa-circle');
                    } else {
                        $('#cellularDiv i').removeClass('fa-circle').addClass('fa-circle-o');
                    }
				});
            } catch (e) {
                console.error('Status bar exception getCellConnectivity: ' + e);
            }
            
			try {	
                device.getWifiConnectivity(function(data) {
					if (data && data.signalStrength > 0) {
						$('#wifiDiv i').removeClass('forcehide');
					} else {
						$('#wifiDiv i').addClass('forcehide');
					} 
				});
            } catch (e) {
				console.error('Status bar exception getWifiConnectivity: ' + e);
			}
            
            try {
				device.isPositionAvailable(function(isAvailable) {
					if (isAvailable) {
						$('#positionDiv i').removeClass('forcehide');
					} else {
						$('#positionDiv i').addClass('forcehide');
					}
				});
				
			} catch (e) {
				console.error('Status bar exception isPositionAvailable: ' + e);
			}
				
            try {
                 device.getBatteryLevel(function(level) {
					$('#batteryText').text(level + "%");
					
					if (level > 95) {
						$('#batteryDiv i').removeClass(this.__bateryClass).addClass('fa-battery-4');
						this.__bateryClass = 'fa-battery-4';
						return;
					}
					
					if (level > 75) {
						$('#batteryDiv i').removeClass(this.__bateryClass).addClass('fa-battery-3');
						this.__bateryClass = 'fa-battery-3';
						return;
					} 
					
					if (level > 50) {
						$('#batteryDiv i').removeClass(this.__bateryClass).addClass('fa-battery-2');
						this.__bateryClass = 'fa-battery-2';
						return;
					} 

					if (level > 25) {
						$('#batteryDiv i').removeClass(this.__bateryClass).addClass('fa-battery-1');
						this.__bateryClass = 'fa-battery-1';
					} else {
						$('#batteryDiv i').removeClass(this.__bateryClass).addClass('fa-battery-0');
						this.__bateryClass = 'fa-battery-0';
					}
				});
			} catch (e) {
				console.error('Status bar exception getBatteryLevel: ' + e);
			}
		}
	};
});