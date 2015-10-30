(function () {
    'use strict';
    define([], function () {

    	InitTabsController.$inject = ['$rootScope', '$scope', 'LoginService', 'LocalDBService'];

        function InitTabsController($rootScope, $scope, loginService, localDBService) {
 
        	   $scope.firstLogin = true;  //first time on login tab
        	   $scope.firstVehicle = true; //first time on vehicle tab
        	   $scope.selectionModeVehicle = true;
        	   
        	   $scope.changeArrowPosition = function(index){
               	
               	var allElems = document.getElementsByClassName("tab-item")
               	for(var i = 0; i < allElems.length; i++){
               		angular.element(allElems[i]).removeClass('arrow-tab-0');
                   	angular.element(allElems[i]).removeClass('arrow-tab-1');
                   	angular.element(allElems[i]).removeClass('arrow-tab-2');
               	}
               	 var elems = document.getElementsByClassName("tab-item-active");
                 if(elems != undefined && elems.length > 0){
                 	angular.element(elems[0]).addClass("arrow-tab-"+ index);
                 }
               };
            
                $scope.$on('$ionicView.enter', function() {
                    $scope.messages = DSV.constants.messages;
                });
               
               $scope.returnToLogin = function (){
            	   if($scope.firstLogin == false){
            			$scope.firstVehicle = true;
    	          	    $scope.selectionModeVehicle = true;
    	          	    $scope.removeAllChecks();
    	          	    if(DSV.driver.username != ''){

		      	        	loginService.logout(DSV.driver)
		      	             .then(function(data) {
			      	            	 $.when(localDBService.init(DSV.constants.DSVDrivers, { searchFields: DSV.searchFields[DSV.constants.DSVDrivers] }))
			      	                 .then(function() {             		  
			                          	console.log('[MenuController] - deleting driver...');
			                          	$.when(localDBService.removeCollection(DSV.constants.DSVDrivers))
			                          	.then(function() {
			                              	localDBService.closeAll();
			                              	$scope._resetDriver();
			                              	$scope.changeArrowPosition(0); 
			       	                       // $state.go('init.login');
			                          	});
			      	                });
	    	      	           }, function(error){
			                	   $scope.changeArrowPosition(0);
			                   });   
            	   		}
            	   }
            	   $scope.firstLogin = false;
               };
 
               $scope.returnToVehicle = function(){
            	   $scope.selectionModeVehicle = false;
            	   if($scope.firstVehicle == false){
	   	            	loginService.selectOrDeselectVehicle(DSV.driver, false)
	   	                .then(function(data) {
	   	                	$scope.changeArrowPosition(1);
	   	                	DSV.driver.vehicle = '';
	   	                }, function(error){
	   	                	DSV.driver.vehicle = '';
	   	                	$scope.changeArrowPosition(1);
	   	                });	   
            	   }
            	   $scope.firstVehicle = false;
               };
               
            	$scope.$on('selectionModeVehicleChanged', function(event, value) {
            		$scope.selectionModeVehicle = value;
	        	});
	           	
	        	$scope.$on('signInClicked', function(event, value) {
	        		$scope.firstVehicle = value;
	        	});
	        	
	        	$scope.$on('driverSessionExpired', function(event) {
            		$scope._resetDriver();
	        	});
	        	
	        	$scope._resetDriver = function(){
	        		DSV.driver.username = '';
	                DSV.driver.token = '';
	                DSV.driver.expirationDate = 0;
	                DSV.driver.vehicle = '';
	                DSV.driver.isTransport = true;
	                DSV.driver.transportRoute = '';
	                DSV.driver.routeDate = '';
	                DSV.driver.existsTransportRoute = false;
	        	};
	        	
	        	$scope.removeAllChecks = function(index) {
	                var elems = document.getElementsByClassName("icon fa-check");
	                if(elems != undefined){
	                	for(var i = 0; i < elems.length; i++){
	                		angular.element(elems[i]).removeClass("green-check-icon");
	                	}
	                }
	            };
        }

        return InitTabsController;
    })
})();