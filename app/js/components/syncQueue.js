define('syncQueue', [], function() {
    // this queue stores a syncObj that contains operations (get stops, send stops, send position)
    // the queue is simulated as an array (but reversed): 
    //  - enqueue will push an object at the end - O(1), 
    //  - dequeue will remove the first element - O(1) or O(n) depending on how Array.shift() is implemented
    return {
        syncInterval: 45 * 1000,
        retryTimes: 3,
        
        _queue: [],
        
        enqueue: function(syncObj) {
            if (syncObj == undefined || syncObj == null)
                return false;
            if (syncObj.sync == undefined || syncObj.sync == null ||
                 typeof syncObj.sync !== 'function')
                return false;
                
            this._queue.push(syncObj);
            
            return true;
        },
        
        dequeue: function() {
            if (this._queue.length == 0)
                return null;
            
            var elem = this._queue[0];
            this._queue.shift();
            
            return elem;
        },
        
        startSync: function(syncInterval) {
            if (syncInterval)
                this.syncInterval = syncInterval;
            
            var self = this;
            var currentObj = null;
            
            setInterval(function() {
                if (self._queue.length == 0) {// no sync to be done, just return
                    console.log('[SyncQueue] - Nothing to sync...');
                    return;
                }
                
                if (currentObj != null) { // we are during a sync, so wait for it to finish
                    console.log('[SyncQueue] - Sync in progress... checking later...');
                    return;
                }
                
                var syncFunc = function(retryTimes) {
                    if (currentObj == null)
                        return;
                    
                    console.log('[SyncQueue] - Start sync for: ' + currentObj.name);
                    
                    if (retryTimes-- <= 0) { // move the element at the end
                        console.log('[SyncQueue] - Re-enqueue the item: ' + currentObj.name);
                        self.enqueue(currentObj);
                        
                        if (currentObj.onError && typeof currentObj.onError == 'function')
                            currentObj.onError();
                        
                        currentObj = null; // mark it as null so we can continue with another
                        
                        return;
                    }
                    
                    $.when(currentObj.sync())
                    .then(function() {
                        if (currentObj.onSuccess && typeof currentObj.onSuccess == 'function')
                            currentObj.onSuccess();
                        
                        if (self._queue.length > 0) { // get the next one
                            currentObj = self.dequeue();

                            syncFunc(self.retryTimes);
                        } else {
                            currentObj = null; // mark it as null so we can continue with another
                        }
                    })
                    .fail(function() {
                        syncFunc(retryTimes); // retry for currentObj
                    });
                };
                
                // parse full queue
                currentObj = self.dequeue();
                syncFunc(self.retryTimes);
            }, this.syncInterval);
        }
    };
});