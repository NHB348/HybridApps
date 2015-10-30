(function () {
    'use strict';

    define([], function () {

        LocalStorageService.$inject = [];

        function LocalStorageService() {
            this.get = function (key) {
                if (localStorage[key])
                    return localStorage[key];
                else
                    return sessionStorage[key];
            };

            this.set = function(key, value, permanent) {
                if (permanent)
                    localStorage[key] = value;
                else
                    sessionStorage[key] = value;
            };

            this.getSecurityData = function() {
                return {
                    token: this.get('token'),
                    expires: this.get('expires')
                };
            };

            this.deleteSecurityData = function() {
                this.set('token', undefined, true); this.set('token', undefined, false);
                this.set('expires', undefined, true); this.set('expires', undefined, false);
            };
        }
        return LocalStorageService;
    });
})();