var requires = [
    "root/externallib/text!root/plugins/notifications/notifications.html",
    "root/externallib/text!root/plugins/notifications/notification.html",
    "root/externallib/text!root/plugins/notifications/notifications_enable.html",
    "root/externallib/text!root/plugins/notifications/notification_alert.html",
    "root/externallib/text!root/plugins/notifications/notifications_full.html"
];


define(requires, function (notifsTpl, notifTpl, notifsEnableTpl, notifAlert, notifFullTpl) {

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

        wsPrefix: "",

        /**
         * Determines is the plugin is visible.
         * It may check Moodle remote site version, device OS, device type, etc...
         * This function is called when a alink to a plugin functinality is going to be rendered.
         *
         * @return {bool} True if the plugin is visible for the site and device
         */
        isPluginVisible: function() {
            // The plugin is visible either if is available the remote service for pulling notifications or
            // the platform support Push notifications.

            var visible = false;

            if (MM.util.wsAvailable('local_mobile_core_message_get_messages')) {
                MM.plugins.notifications.wsPrefix = "local_mobile_";
                visible = true;
            }

            if (MM.util.wsAvailable('core_message_get_messages')) {
                visible = true;
            }

            visible =       visible ||
                            ((MM.deviceOS == "ios" || MM.deviceOS == "android") &&
                            (MM.util.wsAvailable('core_user_add_user_device') || MM.util.wsAvailable('local_mobile_core_user_add_user_device')) &&
                            MM.util.wsAvailable('message_airnotifier_is_system_configured') &&
                            MM.util.wsAvailable('message_airnotifier_are_notification_preferences_configured'));

            // If the plugin is visible and the device ready event was fired we should register the device.
            // We register the device when a site is loaded in the app and also when the app is opened (see deviceIsReady)
            if (visible && MM.deviceReady) {
                if (MM.getConfig('notifications_enabled', false)) {
                    MM.plugins.notifications.registerDevice(
                    function() {
                        MM.log("Device registered for PUSH after loading plugin", "Notifications");
                    }, function() {
                        MM.log("Error registering device for PUSH after loading plugin", "Notifications");
                    });
                }
            }

            return visible;
        },

        /**
         * This function is called after the Cordova deviceReady event is fired (after a few seconds).
         * See /index.html (deviceready handler)
         */
        deviceIsReady: function() {

            // Register for PUSH Notifications, everytime the app opens.
            // Check that we are inside a site. (Not in the login screen)
            if (typeof(MM.config.current_site) !== "undefined" && MM.config.current_site) {
                // Are notifications enabled?
                if (MM.getConfig('notifications_enabled', false)) {
                    MM.plugins.notifications.registerDevice(
                    function() {
                        MM.log("Device registered for PUSH after deviceReady", "Notifications");
                    }, function() {
                        MM.log("Error registering device for PUSH after deviceReady", "Notifications");
                    });
                }
            }
        },

        /**
         * Enable notifications button click handler
         *
         */
        _enableNotifications: function() {
            MM.plugins.notifications.registerDevice(
            function() {
                // Success callback.
                MM.setConfig('notifications_enabled', true);
                MM.popMessage(MM.lang.s('notificationsenabled'));
                MM.panels.menuStatus = true;
                MM.plugins.notifications.showNotifications();
            },
            function(m) {
                // Error callback.
                MM.popErrorMessage(m);
            });
        },

        /**
         * Disable notifications
         * This function invalidates the APN token
         *
         * @param  {bool} silently If true, no feedback to the user is given
         */
        _disableNotifications: function(silently) {
            var pushNotification = window.plugins.pushNotification;
            pushNotification.unregister(
                function() {
                    MM.setConfig('notifications_enabled', false);
                    if (typeof(silently) !== "undefined" && !silently) {
                        MM.popMessage(MM.lang.s('notificationsdisabled'));
                        MM.panels.menuStatus = true;
                        MM.plugins.notifications.showNotifications();
                    }
                    MM.log("Notifications disabled", "Notifications");
                },
                function() {
                    MM.log("Error disabling notifications", "Notifications");
                }
            );
        },

        /**
         * Check if the remote Moodle has the airnotifier plugin correctly configured.
         * If so, we perfom and additional check to see if the user has configured the plugin.
         *
         */
        _checkAirnotifierSettings: function() {

            // Check if the plugin is correctly configured by an administrator.
            MM.moodleWSCall(
                'message_airnotifier_is_system_configured',
                {},
                function(configured) {
                    if (configured === 1) {
                        // Check if the user has configured the plugin.
                        MM.moodleWSCall(
                            'message_airnotifier_are_notification_preferences_configured',
                            {"userids[0]": MM.config.current_site.userid},
                            function(preferences) {
                                if (typeof(preferences["users"]) != "undefined") {
                                    _.each(preferences["users"], function(pref) {
                                        if (pref["userid"] == MM.config.current_site.userid &&
                                            parseInt(pref["configured"]) == 0) {
                                            MM.popErrorMessage(MM.lang.s("notificationpreferencesnotconfigured"));
                                            return;
                                        }
                                    });
                                }
                            },
                            null,
                            function() {
                                MM.log("Error calling message_airnotifier_are_notification_preferences_configured", "Notifications");
                            }
                        );
                    } else {
                        MM.popErrorMessage(MM.lang.s("remotesystemnotconfiguredfornotifications"));
                    }
                },
                null,
                function() {
                    MM.log("Error calling message_airnotifier_is_system_configured", "Notifications");
                }
            );

        },

        _renderNotifications: function(notifications) {
            tpl = {notifications: notifications};
            html = MM.tpl.render(MM.plugins.notifications.templates.notificationsFull.html, tpl);
            MM.panels.show('center', html, {hideRight: true, title: MM.lang.s("notifications")});
            $(".reply-button").on(MM.clickType, function(e) {
                e.preventDefault();
                var userId = $(this).data("useridfrom");
                if (MM.plugins.sendmessage) {
                    MM.plugins.sendmessage._displayMessageForm(userId);
                } else {
                    var url = MM.config.current_site.siteurl + "/message/index.php?user=" + MM.config.current_site.userid + "&id=" + userId;
                    window.open(url, "_system");
                }
            });
        },

        _format: function(text) {
            text = text.replace(/-{4,}/ig, '');
            text = MM.util.formatText(text, true);
            text = MM.util.createLinks(text).replace(/<br \/><br \/>/ig, "<br />");
            return text;
        },

        /**
         * Notifications plugin main entry point for the user
         * It may display the button for enable notifications or the list of notifications received
         *
         */
        showNotifications: function() {
            var html, tpl;

            MM.panels.showLoading('center');
            MM.panels.hide("right", "");
            MM.Router.navigate('');

            // We display the notifications in different ways depending if the notifications are Push or via the WS.
            if (MM.util.wsAvailable('local_mobile_core_message_get_messages') ||
                    MM.util.wsAvailable('core_message_get_messages')) {

                $('a[href="#notifications"]').addClass('loading-row');

                var limit = 50;

                var params = {
                    useridto: MM.config.current_site.userid,
                    useridfrom: 0,
                    type: 'notifications',
                    read: 0,
                    newestfirst: 1,
                    limitfrom: 0,
                    limitnum: limit
                };

                MM.moodleWSCall(
                    MM.plugins.notifications.wsPrefix + 'core_message_get_messages',
                    params,
                    function(notifications) {
                        if (notifications.messages) {
                            if (notifications.messages.length >= limit) {
                                MM.plugins.notifications._renderNotifications(notifications);
                            } else {
                                params.limitnum = limit - notifications.messages.length;
                                params.read = 1;
                                MM.moodleWSCall(
                                    MM.plugins.notifications.wsPrefix + 'core_message_get_messages',
                                    params,
                                    function(morenotifications) {
                                        $('a[href="#notifications"]').removeClass('loading-row');
                                        if (morenotifications.messages) {
                                            MM.plugins.notifications._renderNotifications(
                                                notifications.messages.concat(morenotifications.messages));
                                        } else {
                                            MM.plugins.notifications._renderNotifications(notifications.messages);
                                        }
                                    },
                                    {
                                        getFromCache: false,
                                        saveToCache: true
                                    },
                                    function() {
                                        $('a[href="#notifications"]').removeClass('loading-row');
                                        MM.plugins.notifications._renderNotifications([]);
                                    }
                                );
                            }
                        }
                    },
                    {
                        getFromCache: false,
                        saveToCache: true
                    },
                    function() {
                        $('a[href="#notifications"]').removeClass('loading-row');
                        MM.plugins.notifications._renderNotifications([]);
                    }
                );
                return;
            } else if (MM.getConfig('notifications_enabled', false)) {

                // Look for notifications for this site.
                var notificationsFilter = MM.db.where("notifications", {siteid: MM.config.current_site.id});
                var notifications = [];

                $.each(notificationsFilter, function(index, el) {
                    // Iterate backwards for reversing chronological order.
                    notifications.unshift(el.toJSON());
                });

                tpl = {notifications: notifications};
                html = MM.tpl.render(MM.plugins.notifications.templates.notifications.html, tpl);

                if (notifications.length > 0) {
                    MM.panels.show('center', html);

                    // Clear badge count in the icon.
                    var pushNotification = window.plugins.pushNotification;
                    if (typeof(pushNotification.setApplicationIconBadgeNumber) === "function") {
                        MM.plugins.notifications.badgeCount = 0;
                        pushNotification.setApplicationIconBadgeNumber(
                            function() {}, // Unused callback.
                            function() {}, // Unused callback.
                            MM.plugins.notifications.badgeCount);
                    }
                    // Load the first notification.
                    if (MM.deviceType == "tablet") {
                        $("#panel-center li:eq(0)").addClass("selected-row");
                        MM.plugins.notifications.viewNotification(notifications.shift().id);
                        $("#panel-center li:eq(0)").addClass("selected-row");
                    }
                } else {
                    MM.panels.show('center', html, {hideRight: true});
                }


                var disableButton = '\
                    <div class="centered">\
                        <button id="notifications-disable">' + MM.lang.s("disablenotifications") + '</button>\
                    </div>';
                $("#panel-center").append(disableButton);
                $('#notifications-disable').on(MM.clickType, function() {
                    MM.plugins.notifications._disableNotifications(false);
                });

                // Now, we should check if the Moodle site has the airnotifier plugin correctly configured.
                MM.plugins.notifications._checkAirnotifierSettings();


            } else {
                tpl = {};
                html = MM.tpl.render(MM.plugins.notifications.templates.notificationsEnable.html, tpl);
                MM.panels.show('center', html, {hideRight: true});
                $('#notifications-enable').on(MM.clickType, MM.plugins.notifications._enableNotifications);
            }
        },

        /**
         * Displays a single notification
         *
         * @param  {int} id The notification storage id
         */
        viewNotification: function(id) {
            var pageTitle = MM.lang.s("notifications");
            var notification = MM.db.get("notifications", id);
            notification = notification.toJSON();

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
            },
            "notificationAlert": {
                html: notifAlert
            },
            "notificationsFull": {
                html: notifFullTpl
            }
        },

        /**
         * Register a device in Google GCM using the Phonegap PushPlugin
         * It also register the device in the Moodle site using the core_user_add_user_device WebService
         * We need the device registered in Moodle so we can connect the device with
         * the message output Moode plugin airnotifier
         *
         * @param  {function} successCallback Callback for win
         * @param  {function} errorCallback   Callback for fail
         */
        registerDeviceGCM: function(successCallback, errorCallback) {

            var pushNotification = window.plugins.pushNotification;

            pushNotification.register(
                function(result) {
                    MM.log("Device connected with GCM: " + result, "Notifications");
                },

                function(error) {
                    errorCallback(MM.lang.s("errorduringdevicetokenrequest"));
                    MM.log("Error during device token request: " + error, "Notifications");
                },

                {
                    "senderID": MM.config.gcmpn,
                    "ecb":"MM.plugins.notifications.GCMsaveAndDisplay"
                }
            );
        },

        /**
         * Register a device in Apple APNS (Apple Push Notificaiton System) using the Phonegap PushPlugin
         * It also register the device in the Moodle site using the core_user_add_user_device WebService
         * We need the device registered in Moodle so we can connect the device with
         * the message output Moode plugin airnotifier
         *
         * @param  {function} successCallback Callback for win
         * @param  {function} errorCallback   Callback for fail
         */
        registerDeviceAPNS: function(successCallback, errorCallback) {

            var pushNotification = window.plugins.pushNotification;

            pushNotification.register(
                function(token) {
                    // Save the device token setting
                    MM.setConfig('ios_device_token', token);
                    MM.log("Device registered in Apple Push: ..." + token.substring(0, 3), "Notifications");

                    if (typeof(device.name) == "undefined") {
                        device.name = '';
                    }

                    var data = {
                        appid:      MM.config.app_id,
                        name:       device.name,
                        model:      device.model,
                        platform:   device.platform,
                        version:    device.version,
                        pushid:     token,
                        uuid:       device.uuid
                    };

                    var wsFunction = "core_user_add_user_device";
                    if (!MM.util.wsAvailable(wsFunction)) {
                        wsFunction = 'local_mobile_core_user_add_user_device';
                    }
                    MM.moodleWSCall(
                        wsFunction,
                        data,
                        function() {
                            successCallback();
                            MM.log("Device registered in Moodle", "Notifications");
                        },
                        {
                            getFromCache: false,
                            saveToCache: false
                        },
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
                    ecb: "MM.plugins.notifications.APNSsaveAndDisplay"
                }
            );

        },


        /**
         * Register a device in Apple APNS or Google GCM
         *
         * @param  {function} successCallback Callback for win
         * @param  {function} errorCallback   Callback for fail
         */
        registerDevice: function(successCallback, errorCallback) {
            // Request iOS Push Notification and retrieve device token

            if (!window.plugins || !window.plugins.pushNotification) {
                errorCallback();
                return;
            }

            if (MM.deviceOS == 'ios') {
                MM.plugins.notifications.registerDeviceAPNS(successCallback, errorCallback);
            } else if (MM.deviceOS == 'android') {
                MM.plugins.notifications.registerDeviceGCM(successCallback, errorCallback);
            }
        },

        /**
         * This function is called from the PushPlugin when we receive a Notification from GCM
         * The app can be in foreground or background,
         * if we are in background this code is executed when we open the app clicking in the notification bar
         * This code is never executed if the app is in the background (is frozen)
         *
         *
         * @param  {object} event Notification payload
         */
        GCMsaveAndDisplay: function(e) {

            MM.log("Push notification received, type: " + e.event, "Notifications");

            switch (e.event) {
                case 'registered':
                    if ( e.regid.length > 0 ){
                        MM.setConfig('gcm_device_token', e.regid);
                        MM.log("Device registered in GCM: ..." + e.regid.substring(0, 3), "Notifications");

                        if (typeof(device.name) == "undefined") {
                            device.name = '';
                        }

                        var data = {
                            appid:      MM.config.app_id,
                            name:       device.name,
                            model:      device.model,
                            platform:   device.platform,
                            version:    device.version,
                            pushid:     e.regid,
                            uuid:       device.uuid
                        };

                        var wsFunction = "core_user_add_user_device";
                        if (!MM.util.wsAvailable(wsFunction)) {
                            wsFunction = 'local_mobile_core_user_add_user_device';
                        }

                        MM.moodleWSCall(
                            wsFunction,
                            data,
                            function() {
                                MM.log("Device registered in Moodle", "Notifications");
                            },
                            {
                                getFromCache: false,
                                saveToCache: false
                            },
                            function() {
                                MM.log("Error registering device in Moodle", "Notifications");
                            }
                        );
                    } else {
                        MM.log("Device NOT registered in GCM, invalid e.regid");
                    }
                    break;

                case 'message':
                    MM.log("Push notification message received", "Notifications");
                    try {
                        MM.log(JSON.stringify(e), "Notifications");
                    } catch(err) {
                        MM.log("Error decoding content", "Notifications");
                    }

                    var notificationSiteId = 0;

                    // We display the message whatever the site we are.
                    // Notifications are binded to the token id generetad for the entire app.
                    // We are going to receive notifications from different sites.
                    // The event.site is a md5 hash of siteurl+username
                    if (e.payload.message) {
                        // Format and sanitize the input.
                        e.payload.alert = MM.util.cleanTags(MM.util.formatText(e.payload.message));
                        if (e.payload.site) {
                            notificationSiteId = e.payload.site;
                            var site = MM.db.get('sites', notificationSiteId);
                            if (site) {
                                e.payload.site = site.toJSON();
                            } else {
                                e.payload.site = null;
                            }
                        }

                        var notifText = MM.tpl.render(MM.plugins.notifications.templates.notificationAlert.html, {"event": e.payload});
                        MM.popMessage(notifText, {title: MM.lang.s("notifications"), autoclose: 5000, resizable: false});
                    }

                    var pushNotification = window.plugins.pushNotification;
                    if (typeof(pushNotification.setApplicationIconBadgeNumber) === "function") {
                        MM.plugins.notifications.badgeCount++;
                        pushNotification.setApplicationIconBadgeNumber(
                            function() {}, // Unused callback.
                            function() {}, // Unused callback.
                            MM.plugins.notifications.badgeCount);
                    }

                    // Store the notification in the app.
                    // We store the full event (payload) because it may change.
                    MM.db.insert("notifications", {
                        siteid: notificationSiteId,
                        alert: e.payload.alert,
                        notification: e.payload
                    });

                    // Show the notification.
                    if (typeof e.foreground != "undefined" &&
                            (e.foreground === false ||
                            e.foreground === "0" ||
                            e.foreground === 0)) {

                        setTimeout(function() {
                            if (notificationSiteId &&
                                typeof MM.config.current_site != "undefined" &&
                                typeof MM.config.current_site.id != "undefined" &&
                                MM.config.current_site.id == notificationSiteId) {

                                if (typeof e.payload.notif != "undefined") {
                                    if (e.payload.notif === "1" ||
                                        e.payload.notif === 1 ||
                                        e.payload.notif === true) {

                                        location.href = "#notifications";
                                    } else {
                                        location.href = "#messages";
                                    }

                                } else {
                                    location.href = "#notifications";
                                }
                            }
                        }, 2000);
                    }

                    break;

                case 'error':
                    MM.log("Push message error", "Notifications");
                    break;

                default:
                    MM.log("Push unknown message", "Notifications");
                    break;
            }

        },

        /**
         * This function is called from the PushPlugin when we receive a Notification from the APNS
         * The app can be in foreground or background,
         * if we are in background this code is executed when we open the app clicking in the notification bar
         * This code is never executed if the app is in the background (is frozen)
         *
         * event is the payload, the format of the payload is defined in the message output plugin
         * https://github.com/jleyva/moodle-message_airnotifier
         *
         * @param  {object} event Notification payload
         */
        APNSsaveAndDisplay: function(event) {

            MM.log("Push notification received", "Notifications");
            try {
                MM.log(JSON.stringify(event), "Notifications");
            } catch(err) {
                MM.log("Error decoding content", "Notifications");
            }

            var notificationSiteId = 0;

            // We display the message whatever the site we are.
            // Notifications are binded to the token id generetad for the entire app.
            // We are going to receive notifications from different sites.
            // The event.site is a md5 hash of siteurl+username
            if (event.alert) {
                // Format and sanitize the input.
                event.alert = MM.util.cleanTags(MM.util.formatText(event.alert));
                if (event.site) {
                    notificationSiteId = event.site;
                    var site = MM.db.get('sites', notificationSiteId);
                    if (site) {
                        event.site = site.toJSON();
                    } else {
                        event.site = null;
                    }
                }

                var notifText = MM.tpl.render(MM.plugins.notifications.templates.notificationAlert.html, {"event": event});
                MM.popMessage(notifText, {title: MM.lang.s("notifications"), autoclose: 5000, resizable: false});
            }

            if (window.plugins) {
                var pushNotification = window.plugins.pushNotification;
                if (typeof(pushNotification.setApplicationIconBadgeNumber) === "function") {
                    MM.plugins.notifications.badgeCount++;
                    pushNotification.setApplicationIconBadgeNumber(
                        function() {}, // Unused callback.
                        function() {}, // Unused callback.
                        MM.plugins.notifications.badgeCount);
                }
            }

            // Store the notification in the app.
            // We store the full event (payload) because it may change.
            MM.db.insert("notifications", {
                siteid: notificationSiteId,
                alert: event.alert,
                notification: event
            });

            // Show the notification.
            if (typeof event.foreground != "undefined" &&
                    (event.foreground === false ||
                    event.foreground === "0" ||
                    event.foreground === 0)) {

                setTimeout(function() {
                    if (notificationSiteId &&
                        typeof MM.config.current_site != "undefined" &&
                        typeof MM.config.current_site.id != "undefined" &&
                        MM.config.current_site.id == notificationSiteId) {

                        if (typeof event.notif != "undefined") {
                            if (event.notif === "1" ||
                                event.notif === 1 ||
                                event.notif === true) {

                                location.href = "#notifications";
                            } else {
                                location.href = "#messages";
                            }

                        } else {
                            location.href = "#notifications";
                        }
                    }
                }, 2000);
            }
        },

        _getActionLinks: function(notification) {
            if (notification.contexturl && notification.contexturl.indexOf("/mod/forum/") &&
                MM.plugins.forum &&
                MM.plugins.forum.isPluginVisible()) {

                var url = notification.contexturl;
                // Discussion Id.
                var d = url.match(/discuss\.php\?d=([^#]*)/);
                // Course Id.
                var c = notification.fullmessagehtml.match(/course\/view\.php\?id=([^"]*)/);

                if (d && typeof d[1] != "undefined" && c && typeof c[1] != "undefined") {
                    return '<a href="#forum/discussion/' + c[1] + '/' + d[1] +'">' + MM.lang.s("view") + '</a>';
                }
            }
            return "";
        }
    };

    MM.registerPlugin(plugin);

    // After register the plugin, bind events.
    $(document).bind('resume', MM.plugins.notifications.check);
});