'use strict';
requirejs.config({
    'baseUrl': '.',
    'paths': {
        'ionic': 'lib/ionic/js/ionic', // don't use the bundle - grunt-contrib-requirejs will not work
        'angular': 'lib/ionic/js/angular/angular',
        'angular-animate':'lib/ionic/js/angular/angular-animate',
        'angular-sanitize': 'lib/ionic/js/angular/angular-sanitize',
        'angular-ui-router': 'lib/ionic/js/angular-ui/angular-ui-router',
        'ionic-angular': 'lib/ionic/js/ionic-angular',
        'lodash': 'lib/lodash.min',
        'DSVMobile': 'js/app',
        'DSVMobile.controllers': 'js/controllers/controllers.module',
        'DSVMobile.services' : 'js/services_/services.module',
        'DSVMobile.directives' : 'js/directives/directives.module',
        'UpdateModule': 'js/components/UpdateModule',
        'device': 'js/strategies/runtime/device',
        'localDB': 'js/strategies/db/localDB',
        'statusBar': 'js/components/statusBar',
        'init': 'js/components/init',
        'sync': 'js/components/sync',
        'plugins': 'js/components/plugins',
        'syncQueue': 'js/components/syncQueue'
    },
    'shim': {
    	'angular': { 'exports': 'angular' },
        'angular-animate': { deps: ['angular'] },
        'angular-sanitize': { deps: ['angular'] },
        'angular-ui-router': { deps: ['angular'] },
        'ionic': { deps: [] },
        'ionic-angular': { deps: ['angular'] },
        'DSVMobile.directives' : {deps: ['lib']},
        'DSVMobile.services' : {deps: ['lib']},
        'DSVMobile.controllers' : {deps: ['lib']},
        'DSVMobile' : {deps: ['lib', 'DSVMobile.directives',  'DSVMobile.services',  'DSVMobile.controllers']},
        'UpdateModule' : {deps: ['device']},
        'device': { deps: [] },
        'localDB': { deps: [] },
        'statusBar': { deps: ['device'] },
        'sync': { deps: ['localDB', 'device', 'syncQueue']},
        'init': { deps: ['statusBar', 'UpdateModule', 'sync'] },
        'plugins': { deps: [] }
    }
});

define('lib', ['angular',
               'angular-animate',
               'angular-sanitize',
               'angular-ui-router',
               'ionic',
               'ionic-angular']);

// Load the main app module to start the app
requirejs([
     'lib', 'DSVMobile', 'DSVMobile.directives', 'DSVMobile.controllers', 'DSVMobile.services',
    'UpdateModule', 'device', 'localDB', 'init'
    ], function(a, b, c, d, e, f, g, h, init) {
    $.when(init.loadDefaultLanguages())
    .then(function(languages) {
        DSV.constants.languages = languages;
        DSV.constants.messages = languages[0].messages;
        angular.bootstrap(document, ['DSVMobile']);
    })
});
