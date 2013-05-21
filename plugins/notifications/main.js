var requires = [
    "root/externallib/text!root/plugins/notifications/notifications.html"
];


define(requires, function (notifsTpl) {
    
    if (MM.deviceOS != "ios" && !MM.inComputer && !MM.webApp) {
        // Do not register the plugin, it only works for ios currently
        return;   
    }
    
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
            MM.Router.navigate('');
            
            // Look for notifications for this site.
            var notificationsFilter = MM.db.where("notifications", {siteid: MM.config.current_site.id});
            var notifications = [];
            
            $.each(notificationsFilter, function(index, el) {
                // Iterate backwards.
                notifications.unshift(el.toJSON());
            });
            
            if (notifications.length > 0) {
                var tpl = {notifications: notifications};
                var html = MM.tpl.render(MM.plugins.notifications.templates.notifications.html, tpl);
            } else {
                var html = "<h3><strong>" + MM.lang.s("therearentnotificationsyet") + "</strong></h3>";
            }

            MM.panels.show('center', html, {hideRight: true});

        },  
        
        templates: {
            "notifications": {
                html: notifsTpl
            }
        },


        registerDevice: function() {
            // Request iOS Push Notification and retrieve device token
            var pushNotification = window.plugins.pushNotification;
            pushNotification.register(
                function(token) {
                    // Check the device token is not already known
                    if (token != MM.getConfig("ios_device_token")) {
                        // Save the device token setting
                        MM.setConfig('ios_device_token', token);
                        MM.log("Device registered in Apple Push: ..." + token.substring(0, 3), "Notifications");
                    } else {
                        MM.log("Device is yet registered in Apple Push: ..." + token.substring(0, 3), "Notifications");
                    }
                },
                function(error) {
                    MM.log("Error during device token request: " + error, "Notifications");
                },
                {alert:"true", badge:"true", sound:"true", ecb: "saveAndDisplay"}
            );
        },

        saveAndDisplay: function(event) {
            var notification  = event.notification;

            MM.log("Push notification received: " + JSON.stringify(event), "Notifications");
            var pushNotification = window.plugins.pushNotification;

            MM.popMessage(notification.aps.alert, {title: notification.userfrom, autoclose: 4000, resizable: false});

            if (event.alert) {
                navigator.notification.alert(event.alert);
            }
        
            if (event.sound) {
                var snd = new Media(event.sound);
                snd.play();
            }
        
            if (event.badge) {
                pushNotification.setApplicationIconBadgeNumber(successHandler, event.badge);
            }

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
        },
        
        registerForPushNotification: function() {
            
            if (MM.getConfig("notifications_device_registered_site", false, true)) {
                return;
            }
            
            // iOS case
            if (MM.config.current_site && MM.getConfig("ios_device_token")) {
                var data = {
                    "permissions[0]" : "createtoken"
                };

                // TODO: need to check that the site support message_airnotifier_get_access_key
                // Get acces key to add a device token on airnotifier from Moodle site
                MM.moodleWSCall('message_airnotifier_get_access_key', data, function(result) {
                    MM.log('Acces key retrieved from Moodle', 'Notifications');
                    // Add device token to airnotifier
                    var ajaxURL = MM.config.airnotifier_url + MM.getConfig("ios_device_token");
                    $.ajax({
                        type: "POST",
                        url: ajaxURL,
                        dataType: 'json',
                        beforeSend: function(xhr){
                            xhr.setRequestHeader('Access-Control-Allow-Origin', '*');
                            xhr.setRequestHeader('X-AN-APP-KEY', result);
                            xhr.setRequestHeader('X-AN-APP-NAME', MM.getConfig("airnotifier_app_id"));
                            xhr.setRequestHeader('Accept', "application/json");
                        },
                        success: function(response){
                            // Finally register the device on the Moodle site
                            var data = {
                                "device[appname]": MM.getConfig("airnotifier_app_id"),
                                "device[devicenotificationtoken]": MM.getConfig("ios_device_token"),
                                "device[devicename]": window.device.name
                            };
                            MM.moodleWSCall('message_airnotifier_add_user_device', data, function(result) {
                                MM.setConfig("notifications_device_registered_site", true, true);
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