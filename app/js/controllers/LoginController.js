  (function () {
      'use strict';
      define(['plugins'], function (plugins) {

          LoginController.$inject = ['$rootScope', '$scope', '$state', '$stateParams', '$ionicLoading',
                  'LoginService', 'TranslatorService', 'LocalDBService', 'UtilsService', '$timeout', '$ionicPopup', '$filter'];

          function LoginController($rootScope, $scope, $state, $stateParams, $ionicLoading,
                  loginService, translatorService, localDBService, utilsService, $timeout, $ionicPopup, $filter) {
              $scope.credentials={};
              $scope.credentials.username = '';
              $scope.credentials.password = '';
          	$scope.isLoginDisabled = true;
              $scope.vehicles = [];
              $scope.currentVehicles = [];
              var SIZE = DSV.constants.vehicleCountPerPage;
              $scope.pager = {};
              $scope.pager.startIndex = 0;
              $scope.transport = {};
              $scope.transport.transportOffRouteOn = false;
              $scope.transport.transportRouteId = '';
              $scope.transport.routeDate = new Date();
              $scope.transport.spinnerOn = false;

          	$scope.changeCheckColor = function(index) {
                  var elems = document.getElementsByClassName("icon fa-check");
                  if(elems != undefined && elems.length > 0 && elems.length > index){
                  	for(var i = 0; i < elems.length; i++){
                  		if(i <= index){
                  			angular.element(elems[i]).addClass("green-check-icon");
                  		}
                  		else {
                  			angular.element(elems[i]).removeClass("green-check-icon");
                  		}
                  	}
                  }
                  $scope.changeArrowPosition(parseInt(index) + 1);
              };

              $scope.changeArrowPosition = function(index){

              	var allElems = document.getElementsByClassName("tab-item")
              	for(var i = 0; i < allElems.length; i++){
              		angular.element(allElems[i]).removeClass('arrow-tab-0');
                  	angular.element(allElems[i]).removeClass('arrow-tab-1');
                  	angular.element(allElems[i]).removeClass('arrow-tab-2');
              	}
              	  var elems = document.getElementsByClassName("tab-item tab-item-active");
                    if(elems != undefined && elems.length > 0){
                    	angular.element(elems[0]).addClass("arrow-tab-"+ index);
                    }
                    else{
                  	  angular.element(allElems[0]).addClass("arrow-tab-0");
                    }
              };

              $rootScope.$on("$stateChangeSuccess", function(event, toState, toParams, fromState, fromParams) {
  				$timeout(function() {
  					if(toParams.checkScreen != undefined){
  						$scope.changeCheckColor(toParams.checkScreen);
  					}
  					if($state.current.name=='init.login'){
                  		$scope.changeArrowPosition(0);
                  	}
  					if($state.current.name=='init.vehicle' && DSV.driver.vehicle == ''){
  	                	$scope.searchVehicles();
  					}
  				}, 100);
                });

              $scope.$watch('$viewContentLoaded', function() {
                  $ionicLoading.show({
                      template: "Please wait..."
                  });

                  $.when(translatorService.loadSelectedLanguage())
                  .then(function(messages) {
                      DSV.constants.messages = messages;
                      $rootScope.$emit('languageChanged', messages);
                      $scope.messages = messages;
                      $scope.transport.placeholder = $scope.messages.login.transportId;

                      console.log('[LoginController] - searching driver locally...');

                      if($state.current.name=='init.login'){
                          $scope.changeArrowPosition(0);
                      } else if($state.current.name=='init.vehicle'){
                          $scope.changeArrowPosition(1);
                           $scope.$emit('selectionModeVehicleChanged', false);
                      } else {
                          $scope.changeArrowPosition(2);
                      }

                      $ionicLoading.hide();

                      var collectionName = DSV.constants.DSVDrivers;
                      if ($state.current.name=='init.login'){
                          $.when(localDBService.init(collectionName, { searchFields: DSV.searchFields[DSV.constants.DSVDrivers] }))
                          .then(function() {
                              $.when(localDBService.find(collectionName))
                              .then(function(results) {
                                  localDBService.closeAll();
                                  if (results.length != 0) {
                                      results = utilsService.clearDBResults(results);
                                      DSV.driver = results[0];

                                      // check if expirationDate is valid
                                      if(DSV.driver.expirationDate >= new Date().getTime()){
                                          $state.go('init.vehicle', {'checkScreen':  0});
                                      } else {
                                           $scope.$emit('driverSessionExpired');
                                      }
                                  }
                              })
                              .fail(function(err) {
                                  localDBService.closeAll();
                              });
                          });
                      } else if($state.current.name == 'init.vehicle'){
                          if(DSV.driver.vehicle == ''){
                              $scope.searchVehicles();
                          } else {
                              $state.go('init.route', {'checkScreen':  1});
                          }
                      } else if($state.current.name == 'init.route'){
                          if(DSV.driver.transportRoute != ''){
                              $state.go('stops.todo', {status:'todo'});
                          }
                      }
                  });
              });

              $scope.showPopupInvalidUser = function() {
                  var alertPopup = $ionicPopup.alert({
                  title: $scope.messages.login.invalidLoginTitle,
                  template: $scope.messages.login.invalidLoginBody,
                    okType:'button button-light'
                  });
                  alertPopup.then(function(res) {
                    console.log('Invalid credentials');
                  });
                };

                $scope.showPopupDriverInUse = function() {
                    var alertPopup = $ionicPopup.alert({
                      title: $scope.messages.login.driverInUseTitle,
                      template: $scope.messages.login.driverInUseBody,
                      okType:'button button-light'
                    });
                    alertPopup.then(function(res) {
                      console.log('Driver in use');
                    });
                  };

                  $scope.showPopupInvalidTranspRoute = function(isTransp) {
                      var alertPopup = $ionicPopup.alert({
                      title: isTransp ? $scope.messages.login.invalidTranspTitle : $scope.messages.login.invalidRouteTitle,
                      template: isTransp ? $scope.messages.login.invalidTranspBody : $scope.messages.login.invalidRouteBody,
                        okType:'button button-light'
                      });
                      alertPopup.then(function(res) {
                        console.log('Invalid transport / route');
                      });
                    };

                    $scope.showPopupTransportUnavailable = function(driverName, isTransport) {
                        var alertPopup = $ionicPopup.alert({
                          title: isTransport? $scope.messages.login.transportUnavailableTitle : $scope.messages.login.routeUnavailableTitle ,
                          template: isTransport? $scope.messages.login.transportUnavailableBody.replace("User", driverName) : $scope.messages.login.routeUnavailableBody.replace("User", driverName),
                          okType:'button button-light'
                        });
                        alertPopup.then(function(res) {
                          console.log('Transport unavailable');
                        });
                      };

                      $scope.showPopupEmptyTransport = function() {
                        return $ionicPopup.confirm({
                          title: $scope.messages.login.transportEmptyTitle,
                          template: $scope.messages.login.transportEmptyContent,
                          okType: 'button-light'
                        });
                      };

              $scope.scanBarcode = function(sender) {
              	try {
  					var device = require('device');
  					var onSuccess = function(data) {
  						var text = data.barcode || data.text;
  						console.log("Barcode found: " + text);
  						if (text != undefined) {
  							if (sender == 'user' || sender == 'pass') {
  							   var res = text.split(":"); // MPPA-2 - authentication will be a 1-scan operation
  							   if(res.length == 2){
  								   $scope.credentials.username = res[0];
  								   $scope.credentials.password = res[1];
  							   }
  							}
  							if(sender == 'routeTranspId'){
  								$scope.transport.transportRouteId = text;
  							}
  						}
  						device.stopScanBarcode();
  					};
  					var onFailure = function(e) {
  						alert(e);
  					};
  					var options = {};
  					device.scanBarcode(onSuccess, onFailure, options);
  				} catch (e) {
  					console.error('Error @ scanBarcode: ' + JSON.stringify(e));
  				}
              };

          	$scope.changeCredentials = function() {
          		$scope.isLoginDisabled = $scope.credentials.username.length == 0 || $scope.credentials.password.length == 0;
          	};

          	$scope.goToStopListTemp = function(){
          		DSV.driver.existsTransportRoute = true;
          		$state.go('stops.todo', {status:'todo'});
          	};

          	$scope.exit = function(){
          		try {
    					var device = require('device');
    					device.closeApplication();
  	  			} catch (e) {
  	  				console.error('[exit] - Unable to close application' + JSON.stringify(e));
  	  		    }
          	};

          	$scope.goToStopList = function(){

          		var isTransportTemp = !$scope.transport.transportOffRouteOn;
          		if(DSV.driver.transportRoute != $scope.transport.transportRouteId){
          			 $rootScope.$emit('useFirstParametersChanged', false);
          		}
              	if((isTransportTemp && /^[a-zA-Z]{6}-[0-9]{4,4}$/.test($scope.transport.transportRouteId))
              			|| (!isTransportTemp && /^[a-zA-Z]{6,6}$/.test($scope.transport.transportRouteId))){
              		//transport/route format is ok
              		 var elems = document.getElementsByClassName("icon fa-check");
              		 angular.element(elems[elems.length-1]).addClass("green-check-icon");

              		DSV.driver.isTransport = !$scope.transport.transportOffRouteOn;
              		DSV.driver.transportRoute = $scope.transport.transportRouteId;
              		if(!DSV.driver.isTransport){
              			DSV.driver.routeDate  = $filter('date')($scope.transport.routeDate, "yyyy-MM-dd");
              		}
                      $scope.transport.spinnerOn = true;

              		var dfd = $.Deferred();
                		loginService.setDataTransport(DSV.driver)
                   	.then(function() {
                          $rootScope.$emit('languageChanged');

                   		DSV.driver.existsTransportRoute = true;
                   		$scope.transport.spinnerOn = false;

                   		  var collectionName = DSV.constants.DSVDrivers;
                   		 $.when(localDBService.init(collectionName, { searchFields: DSV.searchFields[DSV.constants.DSVDrivers] }))
                   		  .then(function() {

                   			  $.when(localDBService.find(collectionName, { username: DSV.driver.username }))
    		                      .then(function(results) {
    		                        if (results.length != 0) {
    		                        	console.log('[LoginController] - replacing driver...');
    		                        	$.when(localDBService.replace(collectionName, { username: DSV.driver.username }, DSV.driver))
    		                        	.then(function() {
    			                        	localDBService.closeAll();
    			                        	$state.go('stops.todo', {status:'todo'});
    			                            dfd.resolve();
    		                        	});
    		                        } else {
    		                        	console.log('[LoginController] - adding driver...');
    		                            $.when(localDBService.add(collectionName, DSV.driver))
    		                            .then(function() {
    		                            	localDBService.closeAll();
    		                            	$state.go('stops.todo', {status:'todo'});
    		                                dfd.resolve();
    		                            });
    		                        }
    		                    });
                   		  });


                   	}, function(error) {
                   		$scope.transport.spinnerOn = false;
                   		if(error != undefined){
  	                   		 var elems = document.getElementsByClassName("icon fa-check");
  	                   		 angular.element(elems[elems.length-1]).removeClass("green-check-icon");
   	                        switch(error.code) {
   	                           case 527:
   	                        	   $scope.showPopupTransportUnavailable(error.name, DSV.driver.isTransport);
                               break;
   	                           case 525:
   	                        	   DSV.driver.existsTransportRoute = false;
   	                        	   $scope.showPopupEmptyTransport()
                                 .then(function(result) {
                                    if (result)
                                       $state.go('stops.todo', {status:'todo'}); //empty stoplist (no backend search needed)
                                 })
                                break;
   	                       }
                       	}
                   	});
                		 return dfd.promise();
              	}
              	else {
              		$scope.showPopupInvalidTranspRoute(isTransportTemp);
              	}
          	};

              // pager actions
              $scope.onNext = function() {
                  $scope.currentVehicles = [].concat(utilsService.getCollectionBatch(SIZE, $scope.pager, $scope.vehicles));
              };

              $scope.onPrev = function() {
                  $scope.currentVehicles = [].concat(utilsService.getCollectionBatch(-SIZE, $scope.pager, $scope.vehicles));
              };

          	$scope.searchVehicles = function(){
          		var dfd = $.Deferred();

           		loginService.searchVehicles(DSV.driver)
              	.then(function(data) {
              		 console.log('[LoginController] - search vehicles..');
              		 $scope.vehicles = data.vehicleList;
              		 $scope.currentVehicles = [].concat($scope.vehicles.slice(0, SIZE));
                       $scope.pager.endIndex = Math.min(SIZE, $scope.currentVehicles.length);
                       $scope.pager.count = $scope.vehicles.length;
                       dfd.resolve();
              	}, function(error) {
             		 	 console.log('[LoginController] - search vehicles error..');
  	           		 dfd.reject(error);
              	});
           		 return dfd.promise();
              };

              $scope.selectVehicle = function(vehicle){
              	if(vehicle.used == false){
  	            	DSV.driver.vehicle = vehicle.vehicleId;
  	            	loginService.selectOrDeselectVehicle(DSV.driver, true)
  	                .then(function(data) {
  	                	 var dfd = $.Deferred();
  	                	 var collectionName = DSV.constants.DSVDrivers;

  	                	 $.when(localDBService.init(collectionName, { searchFields: DSV.searchFields[DSV.constants.DSVDrivers] }))
  	 	                .then(function() {
  	 	                   $.when(localDBService.find(collectionName, { username: DSV.driver.username }))
  		                    .then(function(results) {
  		                        if (results.length != 0) {
  		                        	console.log('[LoginController] - replacing driver...');
  		                        	$.when(localDBService.replace(collectionName, { username: DSV.driver.username }, DSV.driver))
  		                        	.then(function() {
  			                        	localDBService.closeAll();
  			                        	$state.go('init.route', {'checkScreen':  1});
  			                            dfd.resolve();
  		                        	});
  		                        } else {
  		                        	console.log('[LoginController] - adding driver...');
  		                            $.when(localDBService.add(collectionName, DSV.driver))
  		                            .then(function() {
  		                            	localDBService.closeAll();
  		                            	$state.go('init.route', {'checkScreen':  1});
  	                                    dfd.resolve();
  		                            });
  		                        }
  		                    });
  	 	                });


  	                }, function(error){
  	                	DSV.driver.vehicle = '';
  	                });
              	}
              };

              $scope.changePlaceHolder = function(){
              	if($scope.transport.transportOffRouteOn == false){
              		//transport selected
              		 $scope.transport.placeholder = $scope.messages.login.transportId;
              	}
              	else {
              		//route selected
              		 $scope.transport.placeholder = $scope.messages.login.routeId;
              	}
              };

              $scope.$watch('transport.spinnerOn', function(newValue, oldValue) {
              	var element = document.getElementsByTagName('body')[0];
              	if (newValue) {
              		 angular.element(element).addClass("route-page-disabled");
                  }
                  else {
                  	 angular.element(element).removeClass("route-page-disabled");
                  }
              });

              $scope.signIn = function() {
                  var dfd = $.Deferred();
                  $ionicLoading.show({
                      template: $scope.messages.login.signingIn
                  });

                  $.when(loginService.dummyLogin())
                  .then(function() {
                      $rootScope.$emit('languageChanged');
                      $ionicLoading.hide();
                      $state.go('stops.todo', {status:'todo'});
                      dfd.resolve();
                  });

                  return dfd.promise();

              	  $('#sideMenu').removeClass('hide');
              	  $scope.$emit('signInClicked', true);

                  var username = $scope.credentials.username;
                  var password = $scope.credentials.password
                  var collectionName = DSV.constants.DSVDrivers;

                  console.log('[LoginController] - loggin in driver...');
              	  loginService.login(username, password)
              	  .then(function(data) {
                      DSV.driver = $scope._initDriver();
                      DSV.driver.username = $scope.credentials.username;
                      DSV.driver.token = data.token;
                      DSV.driver.expirationDate = data.expirationDate;

                      $.when(localDBService.init(collectionName, { searchFields: DSV.searchFields[DSV.constants.DSVDrivers] }))
  	                  .then(function() {
  	                    $.when(localDBService.find(collectionName, { username: $scope.credentials.username }))
  	                    .then(function(results) {
  	                        if (results.length != 0) {
  	                        	console.log('[LoginController] - replacing driver...');
  	                        	$.when(localDBService.replace(collectionName, { username: username }, DSV.driver))
  	                        	.then(function() {
  		                        	localDBService.closeAll();
  		                            $ionicLoading.hide();
  		 	                        $state.go('init.vehicle', {'checkScreen': 0});
  		                            dfd.resolve();
  	                        	});
  	                        } else {
  	                        	console.log('[LoginController] - adding driver...');
  	                        	$.when(localDBService.add(collectionName, DSV.driver))
  	                            .then(function() {
  	                            	localDBService.closeAll();
                                      $ionicLoading.hide();
                                      $state.go('init.vehicle', {'checkScreen': 0});

                                      dfd.resolve();
  	                            });
  	                        }
  	                    });
  	                });
              	}, function(error) {
              		 $.when(localDBService.init(collectionName, { searchFields: DSV.searchFields[DSV.constants.DSVDrivers] }))
   	                .then(function() {
   	                	console.log('[LoginController] - searching driver...');
   	                    $.when(localDBService.find(collectionName, { username: $scope.credentials.username }))
   	                    .then(function(results) {
   	                        if (results.length == 1) {
   	                        	results = utilsService.clearDBResults(results);
   	                        	DSV.driver = results[0];

   	                        	localDBService.closeAll();
   	                            $ionicLoading.hide();
   	                            if(DSV.driver.expirationDate >= new Date().getTime() && DSV.driver.vehicle != '' && DSV.driver.transportRoute != ''){
   	                            	$state.go('stops.todo', {status:'todo'});
  	                            }
   	                            dfd.resolve();
   	                        } else {
   	                        	if(error != undefined){
  		 	                        switch(error.code) {
  		 	                           case 522:
  		 	                        		$ionicLoading.hide();
  			 	            				//driver in use: MPPA-4
  			 	                            $scope.showPopupDriverInUse();
  		 	                               break;
  		 	                           case 401:
  		 	                           case 520:
  		 	                        	  $ionicLoading.hide();
  			 	                        	//login failed: MPPA-2
  			 	                        	$scope.showPopupInvalidUser();
  		 	                               break;
  		 	                           default:
  		 	                        	  $ionicLoading.hide();
  		 	                       }
   	                        	}
  	 	                        else {
  	 	                        	 $ionicLoading.hide();
  	 	                        }
   	                        }
   	                    });
   	                });
              	});

              	return dfd.promise();
              };

              $scope._initDriver = function() {
                  return {
                      username: '',
                      token: '',
                      expirationDate: 0,
                      vehicle: '',
                      isTransport: true,
                      transportRoute: '',
                      routeDate: '',
                      existsTransportRoute: true
                  };
              };
          }

          return LoginController;
      });
  })();
