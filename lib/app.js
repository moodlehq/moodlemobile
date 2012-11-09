require.config({
    paths: {
        root: '..'
    }
});

require(["root/lib/text!root/config.json","root/lib/text!root/lang/en.json"],
function (config, lang) {
    
    config = JSON.parse(config);
    MM.init(config);
    
    require.config({
        baseUrl: "plugins",
        packages: config.plugins
    });
    
    var extraLang = "root/lib/text!root/lang/" + config.default_lang + ".json";
    config.plugins.unshift(extraLang);
    
    require(config.plugins,
        function (extraLang) {
            MM.lang.loadLang("core", config.default_lang, JSON.parse(extraLang));
            $(document).ready(function(){
                MM.loadLayout();
            });
        }
    );
});