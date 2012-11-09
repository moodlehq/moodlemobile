/**
 * Moodle mobile sync lib
 *
 * @package core
 * @copyright Juan Leyva <juanleyvadelgado@gmail.com>
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */


MM.sync = {
    interval: 0,
    hooks: {},
    
    init: function() {
        
        MM.sync.hooks = {
            "ws": {
                handler: MM.wsSync,
                time: MM.config.sync_ws
            },
            "lang": {
                handler: MM.lang.sync,
                time: MM.config.sync_lang
            },
            "css": {
                handler: MM.sync.css,
                time: MM.config.sync_css
            }
        };
        
        MM.sync.interval = parseInt(MM.config.sync_cron+'') * 1000;
        MM.log("Sync process starting in..." + MM.config.sync_cron + " seconds");
        // If we get a integer setting as a string, we force to string allways and parses to int
        setTimeout(function(){ MM.sync.syncProcess()}, MM.sync.interval);
    },
    
    syncProcess: function() {
        var newInterval = 0;
        var d = new Date();
        var call = false;
        
        MM.log("Sync process executing, current time: " + d.getTime());
        
        for (var el in MM.sync.hooks) {
            call = false;
            var lastExecution = MM.db.get("settings", "last_sync" + el);

            if(!lastExecution) {
                call = true;
            } else {
                MM.log("Sync el: " + el + " last execution: " + lastExecution.get("value") + ", Time: " + MM.sync.hooks[el].time);
                if(d.getTime() > lastExecution.get("value") + MM.sync.hooks[el].time) {
                    call = true;
                }
            }

            if (call) {
                MM.sync.callHandler(el, MM.sync.hooks[el]);
                newInterval = (newInterval && newInterval > MM.sync.hooks[el].time)? MM.sync.hooks[el].time * 1000: newInterval;
            } else if (lastExecution) {
                if (lastExecution.get("value") + (newInterval / 1000) > lastExecution.get("value") + MM.sync.hooks[el].time) {
                    newInterval = MM.sync.hooks[el].time * 1000;
                }
            }
        }
        
        newInterval = (!newInterval)? MM.sync.interval : newInterval;
        MM.log("Sync: new Interval for sync process: " + newInterval);
        setTimeout(function(){ MM.sync.syncProcess()}, newInterval);
    },
    
    callHandler: function(el, hook) {
        MM.log("Calling hooks for: " + el);
        var d = new Date();
        MM.db.insert("settings", {id: "last_sync" + el, name: "last_sync" + el, value: d.getTime()});
        MM.sync.hooks[el].handler();
    },
    
    /**
     * Function for register hooks from plugins.
     */
    registerHook: function (name, hook) {
        MM.sync.hooks[name] = hook;
    },
    
    css: function () {
        MM.log("Executing css sync function");
        if (MM.deviceConnected() && typeof(MM.config.current_site.mobilecssurl) != "undefined") {
            var cssURL = MM.config.current_site.mobilecssurl;
            $.ajax({
                url: cssURL,
                success:function(data){
                    MM.cache.addElement("css", data, "css");
                    $("#mobilecssurl").html(data);
                }
            });
        }        
    }
}