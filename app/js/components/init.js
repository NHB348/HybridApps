define('init', ['UpdateModule', 'statusBar', 'sync'], function(updateModule, statusBar, sync) {
    return {
        load: function($q, $ionicLoading) {
            var deviceData = {
                    documentHeight: $(document).height(),
                    documentWidth: $(document).width(),
                    windowHeight: $(window).height(),
                    windowWidth: $(window).width(),
                    devicePixelRatio: window.devicePixelRatio,
                    screenWidth: screen.width,
                    screenHeight: screen.height
            };
            DSV.constants.documentHeight = deviceData.documentHeight;
            DSV.constants.documentWidth = deviceData.documentWidth;

            console.log('Working with: ' + JSON.stringify(deviceData));
            
            sync.start();

            if (typeof Rho !== "undefined") {

                // direct update for WM6.5
                $ionicLoading.show({
                    template: 'Updating... Please wait!'
                });

                updateModule.updateFiles()
                .then(function() {
                    $ionicLoading.hide();
                }, function() {
                    $ionicLoading.hide();
                });

                //status bar refresh
                setTimeout(function() { statusBar.checkConnections(); }, 0);
                setInterval(function() {
                    setTimeout(function() { statusBar.checkConnections(); }, 0);
                }, DSV.constants.statusBarInterval);
            } else {
            	this._computeStopListPageSize(deviceData);
                var dpi = this._computeDpi(deviceData);
                var dpi_mult = dpi / 160;

                var stopListItemHeight = ($(document).height() 
                        - dpi_mult * DSV.constants.statusBarHeight
                        - 2 * dpi_mult * DSV.constants.headerHeight // headers + tabs
                        - 2 // active tab border
                        - 3 * DSV.constants.stopsListPageSize // items borders
                        ) / DSV.constants.stopsListPageSize;
                var stopListInboxItemHeight = ($(document).height() 
                        - dpi_mult * DSV.constants.statusBarHeight
                        - 2 * dpi_mult * DSV.constants.headerHeight // headers + scan/enter items
                        - 2 // active tab border
                        - 3 * DSV.constants.stopsListPageSize // items borders
                        ) / DSV.constants.stopsListPageSize;

                var groupPageListHeight = ($(document).height() 
                        - 2 * dpi_mult * DSV.constants.headerHeight // headers + tabs
                        - 2 // active tab border
                        );
                DSV.constants.groupItemCountPerPage = 
                    parseInt(groupPageListHeight / (dpi_mult * DSV.constants.headerHeight));

                if (less) {
                    less.modifyVars({ 
                        "@dpi": dpi,
                        "@headerHeight": dpi_mult * DSV.constants.headerHeight,
                        "@stopListItemHeight": stopListItemHeight,
                        "@statusBarHeight": dpi_mult * DSV.constants.statusBarHeight,
                        "@rho": DSV.constants.rho,
                        "@documentHeight": DSV.constants.documentHeight,
                        "@documentWidth": DSV.constants.documentWidth,
                        "@stopListInboxItemHeight": stopListInboxItemHeight
                    }); 
                }

                // get MFP server url
                if (typeof WL !== "undefined") {
                    WL.App.getServerUrl(function(url) {
                        if (url[url.length - 1] != '/')
                            SERVER_ROOT = url + "/";
                    });
                }
            }
        },
        
        loadDefaultLanguages: function() {
            var dfd = $.Deferred();
            $.ajax({
                type: "GET",
                contentType: "application/json",
                dataType: "json",
                timeout: 20000,
                async: false,
                url: "data/languages.json"
            })
            .done(function(data){
                dfd.resolve(data.languages);
            })
            .fail(function(xhr, textStatus) {
                var text = "HTTP Error: " + xhr.status + "(" + textStatus + ")";
                console.error('[init/loadLanguage] - ' + text);
                dfd.reject({message: text, code: xhr.status});
            });

            return dfd.promise();
        },
        
        _computeStopListPageSize: function(deviceData) {
            var documentHeight = deviceData.documentHeight;

            if (documentHeight <= DSV.constants.group1Height) {
                DSV.constants.stopsListPageSize = 4;
            } else if (documentHeight < DSV.constants.group2Height) {
                DSV.constants.stopsListPageSize = 5;
            } else {
                DSV.constants.stopsListPageSize = 6;
            }
        },

        _computeDpi: function(deviceData) {
            var documentHeight = deviceData.documentHeight;
            var documentWidth = deviceData.documentWidth;

            if (documentHeight == 567 && documentWidth == 360) { // androids
                return 188;
            }
            if (documentHeight == 1134 && documentWidth == 720) { // androids
                return 250;
            }
            if (documentHeight == 1543 && documentWidth == 980) { // androids
                return 270;
            }
            
            if (documentHeight == 640 && documentWidth == 480) { // WM6.5
                return 228.57;
            }

            return 228.57;
        }
    };
})