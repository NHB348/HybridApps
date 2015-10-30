(function () {
    'use strict';

    define([], function () {

        TranslatorService.$inject = ['$rootScope', 'LocalDBService', 'UtilsService'];

        function TranslatorService($rootScope, localDBService, utilsService) {
            
            this.loadLanguages = function() {
                var dfd = $.Deferred();
                
        		$.when(localDBService.init(DSV.constants.DSVLanguages, { searchFields: DSV.searchFields[DSV.constants.DSVLanguages] }))
        		.then(function(){
        			$.when(localDBService.find(DSV.constants.DSVLanguages))
        			.then(function(languages){
                        localDBService.closeAll();
                        
        				if (languages.length == 0) {
                            languages = DSV.constants.languages;
        				} else {
        					languages = utilsService.clearDBResults(languages);
        				}
                        
                        dfd.resolve(languages);
        			})
        			.fail(function(err) {
        				localDBService.closeAll();
                        dfd.resolve(DSV.constants.languages);
        			});
        		});
        		
        		return dfd.promise();
            };
        	
        	this.loadSelectedLanguage = function() {
                var dfd = $.Deferred();
                
        		$.when(this.loadLanguages())
        		.then(function(languages){
        			var language = _getSelectedLanguage(languages);
                    dfd.resolve(language.messages);  
        		});
        		
        		return dfd.promise();
        	};
        	
        	this.setLanguage = function(lang) {
                var dfd = $.Deferred();
                
        		$.when(this.loadLanguages())
        		.then(function(languages) {
                    var messages = null;
        			for (var i=0; i < languages.length; i++) {
                        var language = languages[i];
                        if (language.value == lang) {
                            language.isSelected = true;
                            messages = language.messages;
                        } else {
                            language.isSelected = false;
                        }
                    }
                    
                    $.when(utilsService.saveCollectionAsync(DSV.constants.DSVLanguages, languages))
                    .then(function() {
                        dfd.resolve(messages); 
                    })
                    .fail(function(err) {
                        dfd.reject(err);
                    })
        		});
                
                return dfd.promise();
        	};
        	
        	function _getSelectedLanguage(languages) {
        		for (var i=0; i < languages.length; i++) {
        			var language = languages[i];
        			if (language.isSelected == true) {
        				return language;
        			}
        		}
        	}
        }
        
        return TranslatorService;
    });
})();