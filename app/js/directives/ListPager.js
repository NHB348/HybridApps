(function () {
    'use strict';

    define([], function () {

        ListPager.$inject = [];

        function ListPager() {
        	return {
        	      restrict: 'E', // can be used only as an element
        	      replace: 'true',
        	      scope: false, // use parent scope
        	      templateUrl: 'templates/listPager.html'
        	  };
		};
		
		return ListPager;
		 
    });
})();