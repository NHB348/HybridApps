define('UpdateModule', ['device'], function(device) {
    return {
        getAppVersion: function() {
            var dfd = $.Deferred();
            var url = 'data/version.json'; // get local version

            $.ajax({
                type: "GET",
                contentType: "*/*",
                dataType: "json",
                timeout: 10000,
                async: true,
                cache: false,
                url: url,
                beforeSend : function(xhr) {}
            })
            .done(function(data) {
                dfd.resolve(data);
            })
            .fail(function(xhr, textStatus) {
                var text = "HTTP Error: " + xhr.status + "(" + textStatus + ")";
                //$logger.log('Error on checkCredentials: ' + text);
                dfd.reject({message: text, code: xhr.status});
            });

            return dfd.promise();
        },

        getMetadata: function() {
            var dfd = $.Deferred();
            
            if (device.isOnline() == false) {
                dfd.reject();
                return dfd.promise();
            }
            
            var url = SERVER_ROOT + 'adapters/DirectUpdateAdapter/v1/metadata';
            console.log("Calling: " + url);

            $.ajax({
                type: "POST",
                contentType: "application/x-www-form-urlencoded",
                dataType: "json",
                timeout: 10000,
                cache: false,
                async: true,
                url: url,
                beforeSend : function(xhr) {}
            })
            .done(function(data) {
                dfd.resolve(data);
            })
            .fail(function(xhr, textStatus) {
                var text = "HTTP Error: " + xhr.status + "(" + textStatus + ")";
                //$logger.log('Error on checkCredentials: ' + text);
                dfd.reject({message: text, code: xhr.status});
            });

            return dfd.promise();
        },

        downloadFileByIndex: function(files, index, dfd) {
            if (index == files.length) {
                dfd.resolve();
                return;
            }

            if (device.isOnline() == false) {
                dfd.reject();
                return;
            }
            
            var fileName = files[index];

            if (fileName) {
                console.log('Downloading: ' + fileName);
                var device = require('device');
                var url = SERVER_ROOT + 'adapters/DirectUpdateAdapter/v1/file?fileName=' + fileName;
                console.log("Calling: " + url);

                $.ajax({
                    type: "POST",
                    contentType: "application/x-www-form-urlencoded",
                    dataType: "text",
                    timeout: 10000,
                    async: true,
                    cache: false,
                    url: url,
                    beforeSend : function(xhr) {}
                })
                .done(function(data) {
                    var path = Rho.RhoFile.join(Rho.Application.appBundleFolder, fileName);
                    device.writeFile(path, data, function() {
                        downloadFileByIndex(files, ++index, dfd);     
                    });
                })
                .fail(function(xhr, textStatus) {
                    var text = "HTTP Error: " + xhr.status + "(" + textStatus + ")";
                    //$logger.log('Error on checkCredentials: ' + text);
                    dfd.reject({message: text, code: xhr.status});
                });
            } else {
                dfd.resolve();
            }
        },

        downloadByMetadata: function(metadata) {
            var dfd = $.Deferred();

            downloadFileByIndex(metadata.files, 0, dfd);

            return dfd.promise();
        },

        versionCompare: function(v1, v2, options) {
            var lexicographical = options && options.lexicographical,
                zeroExtend = options && options.zeroExtend,
                v1parts = v1.split('.'),
                v2parts = v2.split('.');

            function isValidPart(x) {
                return (lexicographical ? /^\d+[A-Za-z]*$/ : /^\d+$/).test(x);
            }

            if (!v1parts.every(isValidPart) || !v2parts.every(isValidPart)) {
                return NaN;
            }

            if (zeroExtend) {
                while (v1parts.length < v2parts.length) v1parts.push("0");
                while (v2parts.length < v1parts.length) v2parts.push("0");
            }

            if (!lexicographical) {
                v1parts = v1parts.map(Number);
                v2parts = v2parts.map(Number);
            }

            for (var i = 0; i < v1parts.length; ++i) {
                if (v2parts.length == i) {
                    return 1;
                }

                if (v1parts[i] == v2parts[i]) {
                    continue;
                } else if (v1parts[i] > v2parts[i]) {
                    return 1;
                } else {
                    return -1;
                }
            }

            if (v1parts.length != v2parts.length) {
                return -1;
            }

            return 0;
        },

        updateFiles: function() {
            var dfd = $.Deferred();
            var self = this;

            console.log('[DirectUpdate] - Get app version...');
            self.getAppVersion()
            .then(function(data) {
                console.log('[DirectUpdate] - Get metadata...');
                self.getMetadata()
                .then(function(metadata) {
                    DSV.constants.version = data.version;
                    console.log('[DirectUpdate] - Current:' + data.version + ' New: '+ metadata.version);

                    if (self.versionCompare(data.version, metadata.version) == -1) { // -1 means newer version
                        console.log('[DirectUpdate] - Getting newer version of files...');
                        self.downloadByMetadata(metadata)
                        .then(function() {
                            console.log('[DirectUpdate] - Update done!');
                            dfd.resolve();

                            alert('Update successfull! App will close! Please restart!');

                            try {               				
                                device.closeApplication();
                            } catch (e) {
                                console.error('[DirectUpdate] - Unable to close application' + JSON.stringify(e));
                            }

                        }, function(error) {
                            console.error('[DirectUpdate] - Unable to download files! Error: ' + error.message);
                            dfd.reject();
                        });
                    } else {
                        console.log('[DirectUpdate] - No update is necesary!');
                        dfd.resolve();
                    }
                }, function(error) {
                    console.error("[DirectUpdate] - HTTP Error on getUpdateMetadata:" + error.message);
                    dfd.reject();
                });
            }, function(error) {
                console.error('[DirectUpdate] - Unable to download version.json file!');
                dfd.reject();
            });

            return dfd.promise();
        }   
    };
});
