(function () {
    'use strict';
    define([], function () {

    	AppLangSettingsController.$inject = ['$rootScope', '$scope', '$state', '$ionicLoading', 'TranslatorService'];

        function AppLangSettingsController($rootScope, $scope, $state, $ionicLoading, translatorService) {
                       
    		$scope.$on('$ionicView.enter', function() {
                $scope.messages = DSV.constants.messages;
                $scope._loadLanguages();
    		});
        	
        	$scope.goBack = function() {
        		$state.go('appsettings');
        	};
        	
        	$scope.loadNewLanguage = function(language) {
                if (language.isSelected)
                    return;
                
        		$.when(translatorService.setLanguage(language.value))
                .then(function(messages) {
                    $scope.messages = messages;
                    DSV.constants.messages = messages;
                    $rootScope.$emit('languageChanged', messages);
                    
                    $scope._loadLanguages();
                });
        	};
            
            $scope._loadLanguages = function() {
                $.when(translatorService.loadLanguages())
                .then(function(languages) {
                    $scope.languages = languages;
                    try { $scope.$apply(); }
                    catch(e) { }
                });
            };
        };

        return AppLangSettingsController;
    })
})();