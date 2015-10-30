(function () {
    'use strict';

    define([], function () {

        HorizontalPager.$inject = [];

        function HorizontalPager() {
        	return {
        	      restrict: 'E', // can be used only as an element
        	      replace: 'true',
        	      scope: false, // use parent scope
        	      templateUrl: 'templates/horizontalPager.html'
        	  };
		};
		
		return HorizontalPager;
		 
    });
})();