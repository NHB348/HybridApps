define('plugins', [''], function() {
    return {
        resetZoom: function() {
        	if (typeof cordova !== "undefined")
        		cordova.exec(function() {}, function() {}, "ResetZoomPlugin", "resetZoom", []);
        }
    };
});