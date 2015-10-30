(function () {
    'use strict';
    define([], function () {

    	SignStopController.$inject = ['$rootScope', '$scope', '$stateParams', '$state', '$ionicLoading', 'TranslatorService',  '$ionicPopover', 'UtilsService', 'StopDeviationsService', 'ReceiversService'];

        function SignStopController($rootScope, $scope, $stateParams, $state, $ionicLoading, translatorService, $ionicPopover, utilsService, deviationsService, receiversService) {

        	$scope.label = {};
        	$scope.summary = {};
        	$scope.signature = {};
        	$scope.withDeviations = false;
        	$scope.receiver = {};
        	
            $scope.$on('$ionicView.enter', function() {
                $scope.messages = DSV.constants.messages;
                
                if($scope.podMethod == "PPOD"){
                	$scope.label.podMethod = $scope.messages.signStop.switchSignature;
                }
                else {
                	$scope.label.podMethod = $scope.messages.signStop.switchPPOD;
                }
            
                if ($stateParams.id && $stateParams.id != "") {
                    $scope.id = $stateParams.id;
                }
                
                $scope.loadSignStop();
    		});
            
            $scope.openMenu = function($event) {
            	if ($scope.signStopMenu) 
            		$scope.signStopMenu.show($event);
            };
            
        	$scope.loadSignStop = function() {
				var dfd = $.Deferred();
                $scope._initPopups();
	    		console.log('[SignStopController] - Loading stop...');
	    		
	    		$ionicLoading.show({
            		template: 'Loading... Please wait!'
            	});
	    		
	    		  $.when(utilsService.loadStopAsync($scope.id))
	                .then(function(stop) {
	                    console.log('[SignStopController] - Stop found!');
	                    $scope.stop = stop;
	                    if($scope.podMethod == undefined){
	                    	$scope.podMethod = 'DIGITAL'
	                    }
	                    
	                    //calculate counters
	                    $scope.summary.nbHandledShipments = utilsService.computeDeliveredShipments(stop.shipment.groups);
	                    $scope.summary.nbDeviations = 0;
	                    $scope.summary.nbHandledItems = 0;
	                    for(var i = 0; i < stop.shipment.groups.length; i++){
	                    	 $scope.summary.nbDeviations =  $scope.summary.nbDeviations + utilsService.computeDeviatedItems(stop.shipment.groups[i].items);
	                    	 $scope.summary.nbHandledItems =  $scope.summary.nbHandledItems + utilsService.computeDeliveredItems(stop.shipment.groups[i].items)
	                    }
	                    $scope.withDeviations = $scope.summary.nbDeviations > 0 ;
	                   
	                    $scope.summary.nbTotalShipments = stop.shipment.groups.length;
	                    $scope.summary.nbTotalItems = utilsService.computeTotalNumberOfItems(stop.shipment.groups);
	                    
	                    if($scope.stop.pod == undefined || $scope.stop.pod.signature == undefined){
	                    	  $scope.sigCapture = new SignatureCapture( "signature" );
	                    	  
							$('#signature').attr('width', DSV.constants.documentWidth);
		                      if($scope.withDeviations){
		                    	  $('#signature').attr('height', DSV.constants.documentHeight - 6.7 * DSV.constants.headerHeight);
		                      }
		                      else {
		                    	  $('#signature').attr('height', DSV.constants.documentHeight - 6 * DSV.constants.headerHeight);
		                      }
	                    }
	                    else {	                    	
	                    	 $('#signature').attr('width', DSV.constants.documentWidth);
	                    	 if($scope.withDeviations){
					              $('#signature').attr('height', DSV.constants.documentHeight - 6.7 * DSV.constants.headerHeight);
		                      }
		                      else {
		                    	  $('#signature').attr('height', DSV.constants.documentHeight - 6 * DSV.constants.headerHeight);
		                      }
		                      
	                    	 var c = document.getElementById("signature");
                    	     var ctx = c.getContext("2d");
                    	     var img =  new Image();
                    	     img.onload = function(){
                    	        ctx.drawImage(img, 0, 0);
                    	     }
                    	     img.src = $scope.stop.pod.signature;
	                    }
	                  
	                    $ionicLoading.hide();
	                    dfd.resolve();
	                })
	                .fail(function(err) {
	                    console.error('[SignStopController] - ' + err);
	                    $scope.goBack();
	                    $ionicLoading.hide();

	                    dfd.reject();
	                });
				return dfd.promise();
			};

            $scope._initPopups = function() {
            	$ionicPopover.fromTemplateUrl('templates/Pod/signStopMenu.html',{
            		scope: $scope})
            	.then(function(popover){
            		$scope.signStopMenu = popover;
            	});            
            };
            
            
            $scope.isDelivery = function(stop) {
                return utilsService.isDelivery(stop);
            };
            
            $scope.isPickup = function(stop) {
                return utilsService.isPickup(stop);
            };
            
    	  $scope.goBack = function() {
    		  $state.go('stop-handling', { id: $scope.id }); 
          };   
          $scope._changePodMethod = function() {
        	  if($scope.podMethod == "PPOD"){
	       		   $scope.podMethod = "DIGITAL"; 
	       		   $scope.label.podMethod = $scope.messages.signStop.switchPPOD;
	       	   }
	       	   else {
	       		   $scope.podMethod = "PPOD"; 
	       		   $scope.label.podMethod = $scope.messages.signStop.switchSignature;
	       	   } 
          };
        
          $scope._getDeviation = function(deviations, type, value) {
              var devResult = null;
              $.each(deviations, function(i, deviation){
                  if (deviation.isEnabledForItem && deviation.type == type && deviation.value == value) {
                      deviation.kind = $scope.messages.deviations[deviation.type];
                      deviation.description = $scope.messages.deviations[deviation.value];
                      devResult = deviation;
                  }
              });

              return devResult;
          };
          
          $scope._noPod = function() {
              $.when(deviationsService.loadDeviations())
              .then(function(deviations){

                  $.each($scope.stop.shipment.groups, function(i, group){
                      var deviation = $scope._getDeviation(deviations, group.type, 'Z1');

                      if (deviation == null) {
                          console.warn('[SignStopController] - deviate no pod - deviation is missing');
                          return;
                      };

                      $.each(group.items, function(i, item){                    	  
                    	  if (!item)
                              return;
                          if (item.deviations == undefined)
                              item.deviations = [];
                          
                          item.isDeviated = true;
                          item.deviations.push(deviation); 
                      });
                  });
                 
              	var dfd = $.Deferred();
              	$.when(utilsService.saveStopAsync($scope.stop))
                .then(function() {
                	  $scope.signStopMenu.hide();
                      dfd.resolve();
                  });              	
              });
          };   
          
          $scope.onActionSelected = function(action) {
              switch (action) {
                  case "podMethod":
                	  $scope._changePodMethod();                	   
                	  $scope.signStopMenu.hide();
                      break;
                  case "noPod":
                	  $scope._noPod();
                      break;                      
                  case "details":
                	  $state.go('stop.info', { id: $scope.id, signMode : true });
                	  $scope.signStopMenu.hide();
                	  break;
                  default:
                      break;
              }
          };
          
          $scope.submitPrintedName = function(){
        	  var receiver = {
        			  "city": $scope.stop.city,
        			  "name": $scope.receiver.printedName,
        			  "lastUsed": new Date().getTime(),
        			  "email": ""
        	  };
        	  
        	    var dfd = $.Deferred();
	    		console.log('[SignStopController] - Saving receiver...');
	    		$ionicLoading.show({
	    			template: 'Saving... Please wait!'
	    		});

	    		  $.when(receiversService.saveReceiver(receiver))
	              .then(function() {
	                  $ionicLoading.hide();
	                  dfd.resolve();
	              });

				return dfd.promise();
				
          };
          
          
          
          $scope.onSaveSign = function(){
        	var dfd = $.Deferred();

	    	console.log('[SignStopController] - Saving stop...');	
		    if($scope.sigCapture != undefined){
		    	$ionicLoading.show({
	          		template: 'Saving... Please wait!'
	          	});
		    	
	    		 $.when($scope.sigCapture.getImage())
	                .then(function(signatureData) {
	                    $scope.stop.pod = {};                    
	                    $scope.stop.pod.signature = signatureData;	                  
	                    
	                    // save locally
	    				$.when(utilsService.saveStopAsync($scope.stop))
	                    .then(function() {
	                      $ionicLoading.hide();
	                      dfd.resolve();
	                    });
	                })
	                .fail(function() {
	                	$ionicLoading.hide();
	                    dfd.reject();
		            }); 
		    	}

				return dfd.promise();
          };
          
        }

        return SignStopController;
    })
})();