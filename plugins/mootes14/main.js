var templates = [
    "root/externallib/text!root/plugins/mootes14/theme.css",
    "root/externallib/text!root/plugins/mootes14/login.html"
];

define(templates, function (theme, loginForm) {
    var plugin = {
        settings: {
            name: "mootes14",
            type: "course",
            component: "mod_resource",
            lang: {
                component: "core"
            }
        }
    };

    $("#mobilecssurl").html(theme);
    $("#add-site_template").html(loginForm);
    //$("#manage-accounts_template").html(loginForm);

    MM.checkSite = function(e) {
        MM.addSite(e);
    };

    MM.loadCachedRemoteCSS = function(e) {
        $("#mobilecssurl").html(theme);
    };

    MM._displayManageAccounts = function() {
        MM._displayAddSite();
    }

});