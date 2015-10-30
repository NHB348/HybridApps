(function () {
    'use strict';
    define('DSVMobile.directives',
        [
            'js/directives/ListPager',
            'js/directives/HorizontalPager',
            'js/directives/AnchorDisabledDirective'
        ],
        function (ListPager, HorizontalPager, AnchorDisabledDirective) {
            return angular.module('DSVMobile.directives', [])
                .directive('listPager', ListPager)
                .directive('horizontalPager', HorizontalPager)
                .directive('aDisabled', AnchorDisabledDirective);
        });
})();