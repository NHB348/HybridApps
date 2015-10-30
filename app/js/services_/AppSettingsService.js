(function () {
    'use strict';

    define(['sync'], function () {

        AppSettingsService.$inject = ['LocalDBService', 'UtilsService'];

        function AppSettingsService(localDBService, utilsService) {
            
            this.getSettings = function(driver) {
                return sync.getSettings(driver);
            };
            
            this.loadSettings = function() {
        		var dfd = $.Deferred();
        		
                $.when(utilsService.loadCollectionAsync(DSV.constants.DSVSettings))
                .then(function(results) {
                    if (results.length > 0)
                        dfd.resolve(results);
                    else
                        dfd.reject();
                });
                
                return dfd.promise();
        	},
                
            this.getSettingValueByKey = function(key) {
                if (key == undefined)
                    return null;
                
                var settingValue = null;
                
                $.each(DSV.settings, function(i, setting) {
                    if (setting.key == key) {
                        settingValue = setting.value;
                    }
                });
                    
                return settingValue;
            }
        }
        return AppSettingsService;
    });
})();