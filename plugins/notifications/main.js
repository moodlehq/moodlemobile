var templates = [
    "root/lib/text!root/plugins/notifications/notifications.html",
    "root/lib/text!root/plugins/notifications/notification.html"
];

define(templates, function (notifsTpl, notifTpl) {
    var plugin = {
        settings: {
            name: "notifications",
            type: "general",
            menuURL: "#notifications"
        },

        storage: {
            notification: {type: "model"},
            notifications: {type: "collection", model: "notification"}
        },

        routes: [
            ["notifications", "notifications", "showNotifications"],
            ["notification/:id", "notification_id", "showNotification"]
        ],
        
        showNotifications: function() {
            MM.panels.showLoading('center');
            
            if (MM.deviceType == "tablet") {
                MM.panels.showLoading('right');
            }
            
            // Fetch all the notifications.
            MM.collections.notifications.fetch();
            
            // Look for notifications for this site.
            var notificationsFilter = MM.collections.notifications.where({siteid: MM.config.current_site.id});
            var notifications = [];
            
            $.each(notificationsFilter, function(index, el) {
                notifications.push(el.toJSON());
            });
            
            var tpl = {notifications: notifications};
            var html = _.template(MM.plugins.notifications.templates.notifications.html, tpl);
            MM.panels.show('center', html);
            // Load the first user
            if (MM.deviceType == "tablet") {
                MM.plugins.notifications.showNotification(notifications.shift().id);
            }

        },
        
        showNotification: function(id) {
            MM.collections.notifications.fetch();
            var notification = MM.collections.notifications.get(id).toJSON();;
            
            var html = _.template(MM.plugins.notifications.templates.notification.html, notification);
            MM.panels.show('right', html);
        },
        
        templates: {
            "notification": {
                model: "notification",
                html: notifTpl
            },
            "notifications": {
                html: notifsTpl
            }
        }
        
    }
    
    MM.registerPlugin(plugin);
});