var requires = [
    "root/externallib/text!root/plugins/notifications/notifications.html",
    "root/externallib/text!root/plugins/notifications/notifications_enable.html"
];


define(requires, function (notifsTpl, notifsEnableTpl) {

    var plugin = {
        settings: {
            name: "notifications",
            type: "general",
            icon: "plugins/notifications/icon.png",
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

        /**
         * Determines is the plugin is visible.
         * It may check Moodle remote site version, device OS, device type, etc...
         * This function is called when a alink to a plugin functinality is going to be rendered.
         *
         * @return {bool} True if the plugin is visible for the site and device
         */
        isPluginVisible: function() {
            return MM.deviceOS == 'ios' && MM.util.wsAvailable('core_user_add_user_device');
        },

        _enableNotifications: function() {
            MM.plugins.notifications.registerDevice(
            function() {
                // Success callback.
                MM.setConfig('notifications_enabled', true, true);
                MM.popMessage(MM.lang.s('notificationsenabled'));
                MM.plugins.notifications.showNotifications();
            },
            function(m) {
                // Error callback.
                MM.popErrorMessage(m);
            });
        },

        showNotifications: function() {
            var html;

            MM.panels.showLoading('center');
            MM.panels.hide("right", "");
            MM.Router.navigate('');

            if (MM.getConfig('notifications_enabled', false, true)) {
                // Look for notifications for this site.
                var notificationsFilter = MM.db.where("notifications", {siteid: MM.config.current_site.id});
                var notifications = [];

                $.each(notificationsFilter, function(index, el) {
                    // Iterate backwards.
                    notifications.unshift(el.toJSON());
                });

                if (notifications.length > 0) {
                    var tpl = {notifications: notifications};
                    html = MM.tpl.render(MM.plugins.notifications.templates.notifications.html, tpl);
                } else {
                    html = "<h3><strong>" + MM.lang.s("therearentnotificationsyet") + "</strong></h3>";
                }
                MM.panels.show('center', html, {hideRight: true});
            } else {
                var tpl = {};
                html = MM.tpl.render(MM.plugins.notifications.templates.notificationsEnable.html, tpl);
                MM.panels.show('center', html, {hideRight: true});
                $('#notifications-enable').on(MM.clickType, MM.plugins.notifications._enableNotifications);
            }

        },

        templates: {
            "notifications": {
                html: notifsTpl
            },
            "notificationsEnable": {
                html: notifsEnableTpl
            }
        },


        registerDevice: function(successCallback, errorCallback) {
            // Request iOS Push Notification and retrieve device token
            var pushNotification = window.plugins.pushNotification;
            pushNotification.register(
                function(token) {
                    // Save the device token setting
                    MM.setConfig('ios_device_token', token);
                    MM.log("Device registered in Apple Push: ..." + token.substring(0, 3), "Notifications");

                    var data = {
                        appid:      MM.config.app_id,
                        name:       device.name,
                        model:      device.model,
                        platform:   device.platform,
                        version:    device.version,
                        pushid:     token,
                        uuid:       device.uuid
                    };

                    MM.moodleWSCall(
                        'core_user_add_user_device',
                        data,
                        function() {
                            successCallback();
                            MM.log("Device registered in Moodle", "Notifications");
                        },
                        {cache: false},
                        function() {
                            errorCallback(MM.lang.s("errorregisteringdeviceinmoodle"));
                            MM.log("Error registering device in Moodle", "Notifications");
                        }
                    );
                },
                function(error) {
                    errorCallback(MM.lang.s("errorduringdevicetokenrequesttoapns"));
                    MM.log("Error during device token request: " + error, "Notifications");
                },
                {
                    alert:"true",
                    badge:"true",
                    sound:"true",
                    ecb: "MM.plugins.notifications.saveAndDisplay"
                }
            );
        },

        saveAndDisplay: function(event) {
            var notification  = event.notification;

            MM.log("Push notification received: " + JSON.stringify(event), "Notifications");
            var pushNotification = window.plugins.pushNotification;

            MM.popMessage(notification.aps.alert, {title: notification.userfrom, autoclose: 4000, resizable: false});

            /*if (event.alert) {
                navigator.notification.alert(event.alert);
            }

            if (event.sound) {
                var snd = new Media(event.sound);
                snd.play();
            }

            if (event.badge) {
                pushNotification.setApplicationIconBadgeNumber(successHandler, event.badge);
            }*/

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
        }

    };

    MM.registerPlugin(plugin);

    // After register the plugin, bind events.
    $(document).bind('resume', MM.plugins.notifications.check);
});