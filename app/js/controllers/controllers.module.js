/**
 * Created by EusebiuMarcu on 4/16/2015.
 */
(function () {
    'use strict';
    define('DSVMobile.controllers',
        [
         	'js/controllers/InitTabsController',
            'js/controllers/LoginController',
            'js/controllers/MenuController',
            'js/controllers/AppStatusController',
            'js/controllers/AppSettingsController',
            'js/controllers/StopsTabsController',
            'js/controllers/StopsController',
            'js/controllers/StopDetailsTabsController',
            'js/controllers/StopDetailsController',
            'js/controllers/StopHandlingController',
            'js/controllers/StopDeviationController',
            'js/controllers/StopDeviationPhotoController',
            'js/controllers/MoveShipmentsController',
            'js/controllers/StopsInboxController',
            'js/controllers/AppLangSettingsController',
            'js/controllers/SignStopController',
            'js/controllers/CreateStopController',
            'js/controllers/AddItemsToStopController'
        ],
        function (InitTabsController, LoginController,
        		  MenuController, AppStatusController, AppSettingsController,
        		  StopsTabsController, StopsController,
        		  StopDetailsTabsController, StopDetailsController,
                  StopHandlingController, StopDeviationController, StopDeviationPhotoController, MoveShipmentsController,
                  StopsInboxController, AppLangSettingsController, SignStopController, CreateStopController,
                  AddItemsToStopController) {
            return angular.module('DSVMobile.controllers', [])
                .controller('InitTabsController', InitTabsController)
                .controller('LoginController', LoginController)
                .controller('MenuController', MenuController)
                .controller('AppStatusController', AppStatusController)
                .controller('AppSettingsController', AppSettingsController)
                .controller('StopsTabsController', StopsTabsController)
                .controller('StopsController', StopsController)
                .controller('StopDetailsTabsController', StopDetailsTabsController)
                .controller('StopDetailsController', StopDetailsController)
                .controller('StopHandlingController', StopHandlingController)
                .controller('StopDeviationController', StopDeviationController)
                .controller('StopDeviationPhotoController', StopDeviationPhotoController)
                .controller('MoveShipmentsController', MoveShipmentsController)
                .controller('StopsInboxController', StopsInboxController)
                .controller('AppLangSettingsController', AppLangSettingsController)
                .controller('SignStopController', SignStopController)
                .controller('CreateStopController', CreateStopController)
                .controller('AddItemsToStopController', AddItemsToStopController);
        });
})();
