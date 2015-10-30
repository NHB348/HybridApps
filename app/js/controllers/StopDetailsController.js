(function () {
    'use strict';
    define([], function () {

        StopDetailsController.$inject = ['$rootScope', '$scope', '$stateParams', '$state', '$ionicLoading',
                                         'UtilsService', 'TranslatorService'];

        function StopDetailsController($rootScope, $scope, $stateParams, $state, $ionicLoading,
        								utilsService, translatorService) {
                        
            $scope.mvvm = {};
            $scope.mvvm.services = [];
            $scope.mvvm.weight = { value: 0 };
            $scope.mvvm.volume = { value: 0 };
            $scope.mvvm.comment = '';
            $scope.mvvm.LDM = 0;

			$scope.loadStop = function() {
				var dfd = $.Deferred();
				
	    		console.log('[StopDetailsController] - Loading stop...');
	    		$ionicLoading.show({
            		template: 'Loading... Please wait!'
            	});
                
                $.when(utilsService.loadStopAsync($scope.id))
                .then(function(stop) {
                    console.log('[StopDetailsController] - Stop found!');
                    $scope.stop = stop;
                    
                    $scope._setStopTypes(stop);
                    $scope._mergeServices(stop);
                    $scope._mergeWeights(stop);
                    $scope._mergeVolumes(stop);
                    
                    $scope.mvvm.stopItemsCount = $scope.computeNumberOfItems(stop);

                    $ionicLoading.hide();
                    dfd.resolve();
                })
                .fail(function(err) {
                    console.error('[StopDetailsController] - ' + err);
                    $scope.goBack();
                    $ionicLoading.hide();

                    dfd.reject();
                });
				
				return dfd.promise();
			};
    		
    		$scope.$on('$ionicView.enter', function() {
                $scope.messages = DSV.constants.messages;

                if ($stateParams.id && $stateParams.id != "") {
                    $scope.id = $stateParams.id;
                    $scope.$emit('stopRetrieved', $scope.id);
                }

                if ($stateParams.signMode && $stateParams.signMode != "") {
                    $scope.signMode = $stateParams.signMode === 'true';
                    $scope.$emit('stopSignMode', $scope.signMode);
                }

                
    			$scope.loadStop();
    		});
        	
        	$scope.goBack = function() {
        	  if($scope.signMode){
       			  $state.go('signStop', { id: $scope.id });
       		  }
       		  else {
           		  $state.go('stops.todo', { status: 'todo' });        			  
       		  }
        	};
        	
        	$scope.computeNumberOfItems = function(stop) {
        		if (!stop || !stop.shipment || !stop.shipment.groups)
        			return 0;
        		
        		var sum = 0;
        		for (var i = 0; i< stop.shipment.groups.length; ++i) {
        			var group = stop.shipment.groups[i];
        			if (group.items)
        				sum += group.items.length;
        		}
        		
        		return sum;
        	};
            
            $scope._mergeServices = function(stop) {
                $scope.mvvm.comment = '';
                $scope.mvvm.LDM = 0;
                $.each(stop.shipment.groups, function(index, group) {
                    $scope.mvvm.comment += group.comment + '; ';
                    $scope.mvvm.LDM += parseFloat(group.LDM);
                });
                
                $scope.mvvm.services = utilsService.mergeServices(stop.shipment.groups);
                
                // build ui values
                $.each($scope.mvvm.services, function(i, service) {
                    if (service.uivalue == undefined || service.uivalue == '') {
                        service.uivalue = service.value + ' ' + (service.unit || '');
                    }
                });
            };
            
            $scope._mergeWeights = function(stop) {
                $scope.mvvm.weight.value = 0;
                $.each(stop.shipment.groups, function(j, group) {
                    $scope.mvvm.weight.value += parseInt(group.weight.value);
                    $scope.mvvm.weight.unit = group.weight.unit;
                });
            };
            
            $scope._mergeVolumes = function(stop) {
                $scope.mvvm.volume.value = 0;
                $.each(stop.shipment.groups, function(j, group) {
                    $scope.mvvm.volume.value += parseInt(group.volume.value);
                    $scope.mvvm.volume.unit = group.volume.unit;
                });
            };
            
            $scope._setStopTypes = function(stop) {
                var pickupStr = utilsService.isPickup(stop) == true ? $scope.messages.deviations["1"] : '';
                var deliveryStr = utilsService.isDelivery(stop) == true ? $scope.messages.deviations["2"] : '';

                if (pickupStr != '' && deliveryStr != '') {
                    $scope.stopTypes = pickupStr + ' ' + $scope.messages.and + ' ' + deliveryStr; 
                } else {
                    if (pickupStr == '') {
                        $scope.stopTypes = deliveryStr; 
                    } else {
                        $scope.stopTypes = pickupStr; 
                    }
                }
            };
        }

        return StopDetailsController;
    })
})();