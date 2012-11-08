/**
 * Moodle mobile cache lib
 *
 * @package core
 * @copyright Juan Leyva <juanleyvadelgado@gmail.com>
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */


MM.cache = {
    
    getElement: function(id, omitExpires) {
        
        MM.log("Trying to get a cached element, id: " + id);
        
        if (typeof omitExpires == "undefined") {
            omitExpires = false;
        }
        
        var cache = MM.collections.cache;
        cache.fetch();
        
        // Cache elements has a prefix indicating the current site.
        id = MM.config.current_site.id + "-" + id;
        cache = cache.get(id);
        
        if(typeof cache == "undefined" || !cache) {
            MM.log("Cached element not found, id: " + id);
            return false;
        }

        cache = cache.toJSON();
        
        if (!omitExpires) {
            var d = new Date();
            if (d.getTime() > cache.mmcacheexpirationtime) {
                return false;
            }
        }

        if(typeof cache.data != "undefined") {
            //console.log(cache.data);
            return cache.data;
        };
        return false;
    },
    
    addElement: function(id, el) {
        MM.log("Adding element to cache: " + id);
        
        var cache = MM.collections.cache;
        id = MM.config.current_site.id + "-" + id;
        
        var cachedEl = {
            id: id,
            data: el,
            mmcacheexpirationtime: 0
        };
        //console.log(cachedEl);

        var d = new Date();
        cachedEl.mmcacheexpirationtime = d.getTime() + MM.getConfig("cache_expiration_time", 0);

        cache.create(cachedEl);
        return true;
    },
    
    addWSCall: function(url, data, res) {
        MM.log("Adding a WS cached call: " + data.wsfunction);
        //console.log(res);
        
        var key = hex_md5(url+JSON.stringify(data));
        MM.cache.addElement(key, res);
        return true;
    },
    
    getWSCall: function(url, data){

        MM.log("Trying to get a WS cached call: " + data.wsfunction);

        if (MM.config.test_enabled) {
            MM.log("Testing is enabled, no WS cached call is returned");
            return false;
        }
        
        if (MM.deviceConnected()) {
            MM.log("Device is connected, no WS cached call is returned");
            return false;
        }

        // Unique hash.
        var key = hex_md5(url+JSON.stringify(data));
        var el = MM.cache.getElement(key, true);
        return el;
    }
}