var requires = [
    "root/externallib/text!root/plugins/notifications/notifications.html"
];

if (MM.deviceOS == "ios" && !MM.inComputer && !MM.webApp) {
    // Add the ios push notifications javascript library.
    requires.push("PushNotification.js");
}

define(requires, function (notifsTpl) {
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
            
            if (MM.deviceOS == "ios" && !MM.inComputer && !MM.webApp) {
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
                    var html = "<h3><strong>" + MM.lang.s("therearentnotificationsyet") + "</strong></h3>";
                }
            } else {
                var html = "<p><h3><strong>" + MM.lang.s("notificationsnotsupported") + "</strong></h3></p>";
            }
            MM.panels.show('center', html, {hideRight: true});

        },  
        
        templates: {
            "notifications": {
                html: notifsTpl
            }
        },
        
        check: function() {
            if (MM.deviceOS == "ios" && !MM.inComputer && !MM.webApp) {
                // Display pending notification.
                var pushNotification = window.plugins.pushNotification;
                // Check for pending notification
                //TODO: pending notification not supported by the current JS (it seems that the objective-c PushPlugin.m code can return it though)
                /*pushNotification.getPendingNotifications(function(notifications) {
                     // notifications format:
                     // {"notifications":[{"applicationStateActive":"0",
                     //                    "url":"http://jerome.../message/index.php?user=2&id=402297",
                     //                    "applicationLaunchNotification":"1",
                     //                    "aps":{"alert":"the notification text"}}]}
                     if (notifications.notifications.length > 0) {
                         MM.plugins.notifications.saveAndDisplay(notifications.notifications[0]);
                     }
                });*/
            }
        },
        
        registerDevice: function() {
            if (MM.deviceOS == "ios" && !MM.inComputer && !MM.webApp) {
                // Request iOS Push Notification and retrieve device token
                var pushNotification = window.plugins.pushNotification;
                pushNotification.register(
                    function(token) {
                        // Check the device token is not already known
                        if (token != MM.getConfig("ios_device_token")) {
                            // Save the device token setting
                            MM.setConfig('ios_device_token', token);
                        }
                    },
                    function(error) {
                        MM.log("ERROR DURING DEVICE TOKEN REQUEST: " + error);
                    },
                    {alert:"true", badge:"true", sound:"true"}
                );
            }
        },
        
        listenEvents: function() {
            if (MM.deviceOS == "ios" && !MM.inComputer && !MM.webApp) {
                $(document).bind('push-notification', function(event) {
                    var notification = event.notification;
                    MM.plugins.notifications.saveAndDisplay(notification);
                });
            }
        },
        
        saveAndDisplay: function(notification) {
            if (MM.deviceOS == "ios" && !MM.inComputer && !MM.webApp) {
                var pushNotification = window.plugins.pushNotification;
                MM.popMessage(notification.aps.alert, {title: notification.userfrom});
                pushNotification.setApplicationIconBadgeNumber(function(){},0);

                // Store the notification in the app.
                MM.db.insert("notifications", {
                    siteid: MM.config.current_site.id,
                    subject: notification.userfrom,
                    date: notification.date,
                    fullmessage: notification.aps.alert,
                    savedmessageid: notification.id,
                    type: notification.type,
                    urlparams: unescape(notification.urlparams)
                });
        
                // Refresh pages if we are on the Notification page.
            }
        },
        
        registerForPushNotification: function() {
            // iOS case
            if (MM.getConfig("ios_device_token")) {
                var data = {
                    "permissions[0]" : "createtoken"
                };

                // TODO: need to check that the site support message_airnotifier_get_access_key

                // Get acces key to add a device token on airnotifier from Moodle site
                MM.moodleWSCall('message_airnotifier_get_access_key', data, function(result) {

                    // Add device token to airnotifier
                    var ajaxURL = MM.config.airnotifier_url + MM.getConfig("ios_device_token");
                    $.ajax({
                        type: "POST",
                        url: ajaxURL,
                        dataType: 'json',
                        beforeSend: function(xhr){
                            xhr.setRequestHeader('Access-Control-Allow-Origin', '*');
                            xhr.setRequestHeader('X-AN-APP-KEY', result);
                            xhr.setRequestHeader('X-AN-APP-NAME', "moodlemobile");
                            xhr.setRequestHeader('Accept', "application/json");
                        },
                        success: function(response){
                            // Finally register the device on the Moodle site
                            var data = {
                                "device[appname]":'moodlemobile',
                                "device[devicenotificationtoken]":MM.getConfig("ios_device_token"),
                                "device[devicename]":window.device.name
                            };
                            MM.moodleWSCall('message_airnotifier_add_user_device', data, function(result) {
                                MM.log('Device registered on Airnotifier and the Moodle site', 'Notifications');
                            });
                        }
                    });    
                }, {cache:0});
            }        
        }        
        
    }
    
    MM.registerPlugin(plugin);
    
    // After register the plugin, bind events.
    $(document).bind('resume', MM.plugins.notifications.check);
});