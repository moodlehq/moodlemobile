var templates = [
    "root/externallib/text!root/plugins/notifications/notifications.html"
];

define(templates, function (notifsTpl) {
    var plugin = {
        settings: {
            name: "notifications",
            type: "general",
            menuURL: "#notifications",
            lang: {
                component: "core"
            }
        },

        storage: {
            notification: {type: "model"},
            notifications: {type: "collection", model: "notification"}
        },

        routes: [
            ["notifications", "notifications", "showNotifications"]
        ],
        
        showNotifications: function() {
            MM.panels.showLoading('center');
            MM.panels.hide("right", "");

            // Look for notifications for this site.
            var notificationsFilter = MM.db.where("notifications", {siteid: MM.config.current_site.id});
            var notifications = [];
            
            $.each(notificationsFilter, function(index, el) {
                notifications.push(el.toJSON());
            });
            
            if (notifications.length > 0) {
                var tpl = {notifications: notifications};
                var html = MM.tpl.render(MM.plugins.notifications.templates.notifications.html, tpl);
            } else {
                var html = MM.lang.s("therearenotnotificationsyet");
            }
            
            MM.panels.show('center', html, {hideRight: true});

        },  
        
        templates: {
            "notifications": {
                html: notifsTpl
            }
        }
        
    }
    
    MM.registerPlugin(plugin);
});