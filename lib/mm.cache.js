/**
 * Moodle mobile cache lib
 *
 * @package core
 * @copyright Juan Leyva <juanleyvadelgado@gmail.com>
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */


MM.cache = {
    
    getElement: function(id, omitExpires) {
        
        MM.log("Cache: Trying to get a cached element, id: " + id);
        
        if (typeof omitExpires == "undefined") {
            omitExpires = false;
        }
               
        // Cache elements has a prefix indicating the current site.
        id = MM.config.current_site.id + "-" + id;
        cache = MM.db.get("cache", id);
        
        if(typeof cache == "undefined" || !cache) {
            MM.log("Cache: Cached element not found, id: " + id);
            return false;
        }

        cache = cache.toJSON();
        
        var d = new Date();
        var now = d.getTime();

        if (!omitExpires) {            
            if (now > cache.mmcacheexpirationtime) {
                return false;
            }
        }

        if(typeof cache.data != "undefined") {
            var expires = (cache.mmcacheexpirationtime - now) / 1000;
            MM.log("Cache: Cached element found, id: " + id + " expires in " + expires + " seconds");
            return cache.data;
        };
        return false;
    },
    
    addElement: function(id, el, type) {
        MM.log("Cache: Adding element to cache: " + id);
        
        if (typeof(type) == "undefined") {
            type = "general";
        }
        
        id = MM.config.current_site.id + "-" + id;
        
        var cachedEl = {
            id: id,
            data: el,
            type: type,
            mmcacheexpirationtime: 0
        };

        var d = new Date();
        cachedEl.mmcacheexpirationtime = d.getTime() + MM.getConfig("cache_expiration_time", 0);

        MM.db.insert("cache", cachedEl);
        return true;
    },
    
    addWSCall: function(url, data, res) {
        MM.log("Cache: Adding a WS cached call: " + data.wsfunction);
        
        var key = hex_md5(url+JSON.stringify(data));
        MM.cache.addElement(key, res, "ws");
        return true;
    },
    
    getWSCall: function(url, data, omitExpires){

        MM.log("Cache: Trying to get a WS cached call: " + data.wsfunction);

        // Unique hash.
        var key = hex_md5(url+JSON.stringify(data));
        var el = MM.cache.getElement(key, omitExpires);
        return el;
    }
}