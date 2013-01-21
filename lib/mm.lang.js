/**
 * Moodle mobile lang lib
 *
 * @package core
 * @copyright Juan Leyva <juanleyvadelgado@gmail.com>
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */


MM.lang = {

    strings: [],
    current: "",
    
    determine: function() {
        // User preferences.
        var lang = MM.getConfig("lang");
        if (typeof(lang) != "undefined") {
            return lang;
        }
        
        // Default site lang.
        if (typeof(MM.config.current_site) != "undefined" && typeof(MM.config.current_site.lang) != "undefined") {
            return MM.config.current_site.lang;
        }
        
        // Default language.
        return MM.config.default_lang;
    },
    
    setup: function(component) {
        
        if (typeof(component) == "undefined") {
            component = "core";
        }
        
        var lang = MM.lang.determine();
        
        // Try to find in cache the language strings.
        // Languages are automatically sync and stored in cache, forcing to not expire.
        var langStrings = MM.cache.getElement("lang-" + component + "-" + lang, true);
        if (langStrings) {
            MM.lang.loadLang(component, lang, langStrings);
            MM.log("Strings: Strings loaded from cache (remote syte)");
        }
    },
    
    loadLang: function(component, lang, strings) {
        MM.log("Strings: Loading lang " + lang);
        MM.lang.current = lang;
        if (typeof(MM.lang.strings[lang]) == "undefined") {
            MM.lang.strings[lang] = [];
        }
        MM.lang.strings[lang][component] = strings;
    },

    loadPluginLang: function(component, strings) {
        MM.log("Strings: Loading plugin lang " + lang);
        MM.lang.strings[MM.lang.current][component] = strings;
        if (MM.lang.current != "en") {
            MM.lang.strings["en"][component] = strings;
        }
    },


    /**
     * Main function for translating strings
     * 
     * @this {MM.lang}
     * @param {string} id The unique id of the string to be translated
     * @param {string} component Core for regular strings or pluginname for plugins
     */    
    s: function(id, component) {
        
        if (typeof(component) == "undefined") {
            component = "core";
        }
        
        var translated = '';
        // First we check if we find the string in the current language.
        if(typeof(MM.lang.strings[MM.lang.current][component]) != "undefined" && typeof(MM.lang.strings[MM.lang.current][component][id]) !== "undefined"){
            translated = MM.lang.strings[MM.lang.current][component][id];
        }
        // If not, we look for the string in the default language "english"
        else if(typeof(MM.lang.strings['en']) != "undefined" && typeof(MM.lang.strings['en'][component][id]) !== "undefined"){
            translated = MM.lang.strings['en'][component][id];
        }
        
        // If not found yet, we look for the string in the base language file (lang/en.json)
        if (!translated && MM.lang.base[id]) {
            translated = MM.lang.base[id];
        }
    
        // For missing strings, we use the [string] notation.
        if(! translated){
            translated = "[[" + id + "]]";
        }
        return translated;
    },
    
    sync: function() {
        MM.log("Sync: Executing lang sync function");
        var lang = MM.lang.determine();
        
        if (MM.deviceConnected() && MM.getConfig("sync_lang_on")) {
            var data = {
                "component": "mobile",
                "lang": lang
            }
            
            MM.log("Sync: Loading lang file from remote site for core");
            MM.moodleWSCall("core_get_component_strings", data, function(strings) { 
                MM.cache.addElement("lang-core-" + lang, strings, "lang");
            }, {silently: true, cache:false});
            
            for (var el in MM.plugins) {
                var plugin = MM.plugins[el];
                var component = plugin.settings.lang.component;
                if (component != "core") {
                    var data = {
                        "component": component,
                        "lang": lang
                    }
                    MM.log("Sync: Loading lang from remtote site for component: " + component);
                    MM.moodleWSCall("core_get_component_strings", data, function(strings) { 
                        MM.cache.addElement("lang-" + data.component + "-" + lang, strings, "lang");
                    }, {silently: true});
                }
            }
        }
    }
}