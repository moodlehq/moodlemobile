/**
 * Moodle mobile cache lib
 *
 * @package core
 * @copyright Juan Leyva <juanleyvadelgado@gmail.com>
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */


MM.cache = {
    
    getElement: function(id) {
        var cache = MM.collections.cache;
        cache.fetch();
        id = MM.config.current_site.id + "-" + id;
        cache = cache.get(id);
        if(typeof cache != "undefined") {
            return cache;
        };
        return false;
    },
    
    addElement: function(id, el) {
        var cache = MM.collections.cache;
        id = MM.config.current_site.id + "-" + id;
        el.id = id;
        cache.create(el);
        return true;
    },
    
    addWSCall: function(url, data, result) {
        var key = hex_md5(url+JSON.stringify(data));
        MM.cache.addElement(key, result);
        return true;
    },
    
    getWSCall: function(url, data){

        if (MM.config.test_enabled) {
            return false;   
        }
        
        if (MM.deviceConnected()) {
            return false;
        }

        // Unique hash.
        var key = hex_md5(url+JSON.stringify(data));
        var el = MM.cache.getElement(key);
        return el;
    }
}