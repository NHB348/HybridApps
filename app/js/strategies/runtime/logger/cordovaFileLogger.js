/**
 * Generic logger.
 */
define([], function() {
	
	return {
			
		_fileSystem: undefined,

		logConsole: function(text) {
			console.log(text);
		},
	
		init: function() {
		    if (this._fileSystem != undefined) {
		    	return;
		    }
		    
		    var dfd = $.Deferred();
			var that = this;
		    var gotFS = function (fileSystem) {
		    	that._fileSystem = fileSystem;
		    	dfd.resolve();
		    };
			
		    window.requestFileSystem(1, 0, gotFS, console.error);
		    
			return dfd.promise();
		},
		
		logText: function(fileSystem, level, text) {			
			var dfd = $.Deferred();
			var gotFileEntry = function(fileEntry) {
				var gotFileWriter = function(writer) {
			        writer.onwriteend = function(evt) { };
			        writer.seek(writer.length);
			        writer.write("["+ (new Date()).toLocaleString() + "] - " + level + " : " + text + "\r\n");
			    };
			    
		        fileEntry.createWriter(gotFileWriter, console.error);
		    };
		    
			fileSystem.root.getFile("log.txt", {create: true, exclusive: false}, gotFileEntry, console.error);
			
			return dfd.promise();
		},	
		
		logError: function(text) {
			var that = this;
			$.when(that.init()).then(function() {
				console.error(text);
				that.logText(that._fileSystem, "ERROR", text);
			});
		},
		
		logWarning: function(text) {
			var that = this;
			$.when(that.init()).then(function() {
				console.warn(text);
				that.logText(that._fileSystem, "WARN", text);
			});
		},
		
		log: function(text) {
			var that = this;
			$.when(that.init()).then(function() {
				console.log(text);
				that.logText(that._fileSystem, "NORMAL", text);
			}).fail(function(errorObj) { console.error("fileLogger @ log:" + errorObj); });
		}
	};
});