(function () {
    'use strict';
    define([], function () {

    	AppSettingsController.$inject = ['$rootScope', '$scope', '$stateParams', '$state', '$ionicLoading',
                                         'AppSettingsService', 'UtilsService', 'TranslatorService'];

        function AppSettingsController($rootScope, $scope, $stateParams, $state, $ionicLoading,
        								settingsService, utilsService, translatorService) {
            
    		$scope.loadSettings = function() {
    			console.log('[AppSettingsController] - Loading settings...');

            	var dfd = $.Deferred();
            	$ionicLoading.show({
            		template: 'Loading settings... Please wait!'
            	});
            	
            	$.when(settingsService.loadSettings()) // load from local DB
                .then(function(settings) {
                    console.log('[AppSettingsController] - Loaded settings...');
                    $scope.settings = settings;
                    DSV.settings = $scope.settings;
                    $ionicLoading.hide();

                    dfd.resolve();
                })
                .fail(function(error) {
                    dfd.reject(error);
                    $ionicLoading.hide();

                    $scope.settings = DSV.settings; // take default settings
                });
                
                return dfd.promise();
    		};
    		
    		$scope.$on('$ionicView.enter', function() {
    			$scope.messages = DSV.constants.messages;
    			$scope.loadSettings();
    		});
        	
        	$scope.goBack = function() {
        		$state.go('stops.todo', { status: 'todo' });
        	};
        	
        	$scope.goToSetting = function(settingKey) {
        		switch (settingKey) {
        			case "10000": {
        				$state.go('langsettings');
        				break;
        			}
        			default:{
        				$state.go('appsettings');
        				break;
        			}
        		}
        	};
        };

        return AppSettingsController;
    })
})();