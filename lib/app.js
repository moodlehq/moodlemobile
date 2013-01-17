require.config({
    paths: {
        root: '..'
    }
});

require(["root/externallib/text!root/config.json","root/externallib/text!root/lang/en.json"],
function (config, lang) {
    
    config = JSON.parse(config);
    MM.init(config);
    MM.lang.base = JSON.parse(lang);
    
    
    require.config({
        baseUrl: "plugins",
        packages: config.plugins
    });
    
    var extraLang = "root/externallib/text!root/lang/" + config.default_lang + ".json";
    config.plugins.unshift(extraLang);
    
    require(config.plugins,
        function (extraLang) {
            MM.lang.loadLang("core", config.default_lang, JSON.parse(extraLang));
            $(document).ready(function(){
                MM.loadLayout();
                
                // Register the device in the notifications server, retrieve tokens
                MM.plugins.notifications.registerDevice();

                // Check for notification when the app launch.
                MM.plugins.notifications.check();
                
                // Listen for push events.
                MM.plugins.notifications.listenEvents();
            });
        }
    );	  
});
