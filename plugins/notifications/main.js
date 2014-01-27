var requires = [
    "root/externallib/text!root/plugins/notifications/notifications.html",
    "root/externallib/text!root/plugins/notifications/notification.html",
    "root/externallib/text!root/plugins/notifications/notifications_enable.html"
];


define(requires, function (notifsTpl, notifTpl, notifsEnableTpl) {

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

        badgeCount: 0,

        storage: {
            notification: {type: "model"},
            notifications: {type: "collection", model: "notification"}
        },

        routes: [
            ["notifications", "notifications", "showNotifications"],
            ["notifications/view/:id", "notifications_view", "viewNotification"]
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

        /**
         * This functions is called after the Cordova deviceReady event is fired (after a few seconds).
         *
         */
        deviceIsReady: function() {

            // Register for PUSH Notifications, everytime the app opens.
            // Check that we are inside a site. (Not in the login screen)
            if (typeof(MM.config.current_site) !== "undefined" && MM.config.current_site) {
                // Are notifications enabled?
                if (MM.getConfig('notifications_enabled', false, true)) {
                    MM.plugins.notifications.registerDevice(function() {
                        MM.log("Device registered for PUSH after deviceReady", "Notifications");
                    }, function() {
                        MM.log("Error registering device for PUSH after deviceReady", "Notifications");
                    });
                }
            }
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
                    // Clear badge count in the icon.
                    var pushNotification = window.plugins.pushNotification;
                    if (typeof(pushNotification.setApplicationIconBadgeNumber) === "function") {
                        MM.plugins.notifications.badgeCount = 0;
                        pushNotification.setApplicationIconBadgeNumber(function() {}, function() {}, MM.plugins.notifications.badgeCount);
                    }

                    var tpl = {notifications: notifications};
                    html = MM.tpl.render(MM.plugins.notifications.templates.notifications.html, tpl);
                    MM.panels.show('center', html);
                    // Load the first notification.
                    if (MM.deviceType == "tablet") {
                        $("#panel-center li:eq(0)").addClass("selected-row");
                        MM.plugins.notifications.viewNotification(notifications.shift().id);
                        $("#panel-center li:eq(0)").addClass("selected-row");
                    }
                } else {
                    html = "<h3><strong>" + MM.lang.s("therearentnotificationsyet") + "</strong></h3>";
                    MM.panels.show('center', html, {hideRight: true});
                }
            } else {
                var tpl = {};
                html = MM.tpl.render(MM.plugins.notifications.templates.notificationsEnable.html, tpl);
                MM.panels.show('center', html, {hideRight: true});
                $('#notifications-enable').on(MM.clickType, MM.plugins.notifications._enableNotifications);
            }
        },

        viewNotification: function(id) {
            var pageTitle = MM.lang.s("notifications");
            var notification = MM.db.get("notifications", id);
            notification = notification.toJSON();
            var date = notification.notification.date * 1000;
            notification.notification.date = new Date(date).toLocaleDateString();
            notification.notification.date += " " + new Date(date).toLocaleTimeString();

            var html = MM.tpl.render(MM.plugins.notifications.templates.notification.html, notification);

            MM.panels.show('right', html, {title: pageTitle});
        },

        templates: {
            "notifications": {
                html: notifsTpl
            },
            "notification": {
                html: notifTpl
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

            MM.log("Push notification received: " + JSON.stringify(event), "Notifications");

            if (MM.config.current_site.id && event.site == MM.config.current_site.id) {
                if (event.alert) {
                    var notifText = event.alert;
                    MM.popMessage(notifText, {title: MM.lang.s("notifications"), autoclose: 4000, resizable: false});
                }

                var pushNotification = window.plugins.pushNotification;
                if (typeof(pushNotification.setApplicationIconBadgeNumber) === "function") {
                    MM.plugins.notifications.badgeCount++;
                    pushNotification.setApplicationIconBadgeNumber(function() {}, function() {}, MM.plugins.notifications.badgeCount);
                }
            }

            // Store the notification in the app.
            MM.db.insert("notifications", {
                siteid: event.site,
                alert: event.alert,
                notification: event
            });
        }
    };

    MM.registerPlugin(plugin);

    // After register the plugin, bind events.
    $(document).bind('resume', MM.plugins.notifications.check);
});