(function () {
    'use strict';
    define([], function () {

        StopDeviationPhotoController.$inject = ['$rootScope', '$scope', '$stateParams', '$ionicLoading', '$state',
                                                'UtilsService', 'PhotoService', 'TranslatorService'];

        function StopDeviationPhotoController($rootScope, $scope, $stateParams, $ionicLoading, $state,
                                              utilsService, photoService, translatorService) {
            $scope._init = function() {
                $scope.currentPhotoIndex = 0;
                $scope.pager = {};
                $scope.pager.startIndex = 0;
                $scope.pager.endIndex = 0;
                $scope.pager.showNumbers = true;
                $scope.pager.count = 0;
                $scope.deviationPhotos = [];
            };

			$scope.loadStopAsync = function() {
				var dfd = $.Deferred();

	    		console.log('[StopDeviationPhotoController] - Loading stop...');
	    		$ionicLoading.show({
            		template: 'Loading... Please wait!'
            	});

                $.when(utilsService.loadStopAsync($scope.id))
                .then(function(stop) {
                    console.log('[StopDeviationPhotoController] - Stop found!');
                    $scope.stop = stop;

                    $ionicLoading.hide();
                    dfd.resolve();
                })
                .fail(function(err) {
                    console.error('[StopDeviationPhotoController] - ' + err);
	                $scope.goBack(false);
                	$ionicLoading.hide();
	                dfd.reject();
                });

				return dfd.promise();
			};

            $scope.$on("$ionicView.enter", function () {
                $scope.messages = DSV.constants.messages;
                $scope._init();

                if ($stateParams.id && $stateParams.id != "") {
                    $scope.id = $stateParams.id;
                    $scope.code = $stateParams.code;
                    $scope.parentView = $stateParams.parentView;
                }

                $.when($scope.loadStopAsync())
                .then(function() {
                    $scope.item  = utilsService.findItemByCode($scope.stop, $scope.code);
                    if ($scope.item) {
                        if ($scope.item.deviationPhotos == undefined)
                            $scope.item.deviationPhotos = [];

                        $scope.deviationPhotos = $scope.item.deviationPhotos;
                        $scope.pager.endIndex = $scope.deviationPhotos.length;
                        $scope.pager.count = $scope.item.deviationPhotos.length;

                        if ($scope.deviationPhotos.length == 0) { // we have no photos, so trigger capture automatically
                            $scope._takePhoto(0);
                        }
                    } else {
                        $scope.goBack(false);
                    }
                });
            });

            $scope.goBack = function(canceled) {
                if ($scope.parentView == 'StopHandling')
                    $state.go('stop-handling', { id: $scope.id, photoCanceled: canceled });
                if ($scope.parentView == 'CreateStop')
                    $state.go('create-stop', { id: $scope.id, photoCanceled: canceled });
            };

            $scope.onPrev = function() {
                if ($scope.currentPhotoIndex == 0)
                    return;

                $scope.currentPhotoIndex--;
                $scope.pager.startIndex = $scope.currentPhotoIndex;
                $scope.pager.endIndex = $scope.pager.startIndex + 1;
                $scope.deviationPhotos = [$scope.item.deviationPhotos[$scope.currentPhotoIndex]];
            };

            $scope.onNext = function() {
                if ($scope.currentPhotoIndex == $scope.item.deviationPhotos.length - 1)
                    return;

                $scope.currentPhotoIndex++;
                $scope.pager.startIndex = $scope.currentPhotoIndex;
                $scope.pager.endIndex = $scope.pager.startIndex + 1;
                $scope.deviationPhotos = [$scope.item.deviationPhotos[$scope.currentPhotoIndex]];
            };

            $scope.onCapturePhoto = function() {
                var dfd = $.Deferred();
                $.when($scope._takePhoto($scope.item.deviationPhotos.length))
                .then(function() {
                    $scope.currentPhotoIndex = $scope.item.deviationPhotos.length-1;
                    $scope.pager.startIndex = $scope.currentPhotoIndex;
                    $scope.pager.endIndex = $scope.pager.startIndex + 1;

                    dfd.resolve();
                });

                return dfd.promise();
            };

            $scope.onRecapturePhoto = function() {
                $.when($scope._takePhoto($scope.currentPhotoIndex))
                .then(function() { });
            };

            $scope.onAcceptDeviationsPhotos = function() {
                var dfd = $.Deferred();

	    		console.log('[StopDeviationPhotoController] - Saving stop...');
	    		$ionicLoading.show({
            		template: 'Saving... Please wait!'
            	});

				// save locally
				$.when(utilsService.saveStopAsync($scope.stop))
                .then(function() {
                    $ionicLoading.hide();
                    $scope.goBack(false);
                    dfd.resolve();
                });

				return dfd.promise();
            };

            $scope._takePhoto = function(index) {
                var dfd = $.Deferred();

                $.when(photoService.getPicture())
                .then(function(imageData) {
                    $scope.item.deviationPhotos[index] = { data: imageData };
                    $scope.deviationPhotos = [$scope.item.deviationPhotos[index]];
                    $scope.pager.count = $scope.item.deviationPhotos.length;
                    try {
                        $scope.$apply();
                    } catch(e) {}

                    dfd.resolve();
                })
                .fail(function() {
                    alert(messages.genericPhotoError);
                    dfd.reject();
                });

                return dfd.promise();
            };
        }

        return StopDeviationPhotoController;
    })
})();
