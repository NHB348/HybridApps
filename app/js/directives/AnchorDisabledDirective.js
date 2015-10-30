(function () {
    'use strict';

    define([], function () {

    	AnchorDirective.$inject = [];

        function AnchorDirective() {
        	return {
        		restrict: 'A', // can be used only as attribute
        		scope: false, // use parent scope
                compile: function(tElement, tAttrs, transclude) {
                    //Disable ngClick
                    tAttrs["ngClick"] = "!("+tAttrs["aDisabled"]+") && ("+tAttrs["ngClick"]+")";

                    //Toggle "disabled" to class when aDisabled becomes true
                    return function (scope, iElement, iAttrs) {
                        scope.$watch(iAttrs["aDisabled"], function(newValue) {
                            if (newValue !== undefined) {
                                iElement.toggleClass("disabled", newValue);
                            }
                        });

                        //Disable href on click
                        iElement.on("click", function(e) {
                            if (scope.$eval(iAttrs["aDisabled"])) {
                                e.preventDefault();
                            }
                        });
                    };
                }
            };
		};
		
		return AnchorDirective;
		 
    });
})();