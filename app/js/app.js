(function () {
    'use strict';

    define('DSVMobile',
        ['lib', 'init'],
        function (lib, init) {
            angular.module('DSVMobile', [
                'DSVMobile.controllers', 'DSVMobile.services', 'DSVMobile.directives'
            ]);

            angular.module('DSVMobile').config(['$httpProvider', function ($httpProvider) {
                //$httpProvider.interceptors.push('ToasterHttpResponseInterceptor');
            }]);

            angular.module('DSVMobile', ['ionic', 'DSVMobile.controllers', 'DSVMobile.services', 'DSVMobile.directives'])
                .run(function ($ionicPlatform, $q, $ionicLoading) {
                    $ionicPlatform.ready(function() {
                        init.load($q, $ionicLoading);
                    });
                })

                .config(function ($stateProvider, $urlRouterProvider, $ionicConfigProvider) {
                    $ionicConfigProvider.backButton.text('');
                    $ionicConfigProvider.tabs.position('bottom'); // other values: top

                    $stateProvider
                         // login
	                    .state('init', {
					      url: "/init",
					      abstract: true,
					      templateUrl: "templates/Login/initTabs.html",
					      controller: 'InitTabsController'
					    })
					    .state('init.login', {
					      url: "/login",
					      params: { checkScreen: null},
					      views: {
					        'login-tab': {
					          templateUrl: "templates/Login/login.html",
					          controller: 'LoginController'
					        }
					      }
					    })
					     .state('init.vehicle', {
					      url: "/vehicle",
					      params: { checkScreen: null},
					      views: {
					        'vehicle-tab': {
					          templateUrl: "templates/Login/vehicle.html",
					          controller: 'LoginController'
					        }
					      }
					    })
					      .state('init.route', {
					      url: "/route",
					      params: { checkScreen: null},
					      views: {
					        'route-tab': {
					          templateUrl: "templates/Login/route.html",
					          controller: 'LoginController'
					        }
					      }
					    })
					    // status & settings
                        .state('appstatus', {
                            url: '/appstatus',
                            templateUrl: 'templates/appStatus.html',
                            controller: 'AppStatusController'
                        })
                        .state('appsettings', {
                            url: '/appsettings',
                            templateUrl: 'templates/appSettings.html',
                            controller: 'AppSettingsController'
                        })
                        .state('langsettings',{
                        	url: '/applangsettings',
                        	templateUrl: 'templates/langSettings.html',
                        	controller: 'AppLangSettingsController'
                        })
                        // stops
                        .state('stops', {
					      url: "/stops",
					      abstract: true,
					      templateUrl: "templates/stopsTabs.html",
					      controller: 'StopsTabsController'
					    })
					    .state('stops.todo', {
					      url: "/todo/:status/:operation?/:selectedStopId?/:data?",
					      views: {
					        'todo-tab': {
					          templateUrl: "templates/stops.html",
					          controller: 'StopsController'
					        }
					      }
					    })
					    .state('stops.done', {
					      url: "/done/:status",
					      views: {
					        'done-tab': {
					          templateUrl: "templates/stops.html",
					          controller: 'StopsController'
					        }
					      }
					    })
					    .state('stops.canceled', {
					      url: "/canceled/:status",
					      views: {
					        'canceled-tab': {
					          templateUrl: "templates/stops.html",
					          controller: 'StopsController'
					        }
					      }
					    })
					    // stop details
                        .state('stop', {
					      url: "/stop",
					      abstract: true,
					      templateUrl: "templates/StopDetails/stopDetailsTabs.html",
					      controller: 'StopDetailsTabsController'
					    })
					    .state('stop.info', {
					      url: "/info/:id/:signMode",
					      views: {
					        'info-tab': {
					          templateUrl: "templates/StopDetails/stopInfo.html",
					          controller: 'StopDetailsController'
					        }
					      }
					    })
					    .state('stop.parties', {
					      url: "/parties",
					      views: {
					        'parties-tab': {
					          templateUrl: "templates/StopDetails/stopParties.html",
					          controller: 'StopDetailsController'
					        }
					      }
					    })
					    .state('stop.shipments', {
					      url: "/shipments",
					      views: {
					        'shipments-tab': {
					          templateUrl: "templates/StopDetails/stopShipments.html",
					          controller: 'StopDetailsController'
					        }
					      }
					    })
					    .state('stop.instructions', {
					      url: "/instructions",
					      views: {
					        'instructions-tab': {
					          templateUrl: "templates/StopDetails/stopInstructions.html",
					          controller: 'StopDetailsController'
					        }
					      }
					    })
					    .state('stop-handling', {
                            url: '/stop/handle/:id/:photoCanceled?',
                            templateUrl: 'templates/StopHandling/stopHandling.html',
                            controller: 'StopHandlingController'
                        })
                        .state('stop-deviation', {
                            url: '/stop/deviate/:id/:level/:code/:parentView?',
                            templateUrl: 'templates/StopHandling/stopDeviation.html',
                            controller: 'StopDeviationController'
                        })
                        .state('stop-deviation-photo', {
                            url: '/stop/deviate/:id/:code/:parentView?',
                            templateUrl: 'templates/StopHandling/stopDeviationPhoto.html',
                            controller: 'StopDeviationPhotoController'
                        })
					    .state('stop-move-shipments', {
                            url: '/stop/move/:id/:parentView',
                            templateUrl: 'templates/StopHandling/moveShipments.html',
                            controller: 'MoveShipmentsController'
                        })
                        .state('stops-inbox', {
                            url: '/stops/inbox/:withSearch?',
                            templateUrl: 'templates/NewStop/stopsInbox.html',
                            controller: 'StopsInboxController'
                        })
                        .state('signStop', {
	                        url: '/stops/sign/:id',
	                        templateUrl: 'templates/Pod/signStop.html',
	                        controller: 'SignStopController'
                        })
                        .state('create-stop', {
	                        url: '/stop/create/:id?/:data?/:parentView?/:parentId?',
	                        templateUrl: 'templates/NewStop/createStop.html',
	                        controller: 'CreateStopController'
                        })

                    $urlRouterProvider.otherwise('/init/login');
                });

            return angular.module('DSVMobile');
        });
})();
