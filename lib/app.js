require.config({
    paths: {
        root: '..'
    }
});

require(["root/lib/text!root/config.json"],
function (config) {
    
    config = JSON.parse(config);
    MM.init(config);

    require.config({
        baseUrl: "plugins",
        packages: config.plugins
    });

    require(config.plugins,
        function () {
            $(document).ready(function(){
                MM.loadLayout();
            });
        }
    );
});