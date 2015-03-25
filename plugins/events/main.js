var templates = [
    "root/externallib/text!root/plugins/events/events.html",
    "root/externallib/text!root/plugins/events/event.html"
];

define(templates, function (eventsTpl, eventTpl) {
    var plugin = {
        settings: {
            name: "events",
            type: "general",
            icon: "plugins/events/icon.png",
            menuURL: "#events/90",
            lang: {
                component: "core"
            }
        },

        storage: {
            "event": {type: "model"},
            "events": {type: "collection", model: "event"}
        },

        routes: [
            ["events/:days", "show_events", "showEvents"],
            ["events/show/:id", "show_event", "showEvent"]
        ],

        // This is like a static variable where we store the last Events retrieved in JSON format.
        lastEvents: null,

        /**
         * Determines is the plugin is visible.
         * It may check Moodle remote site version, device OS, device type, etc...
         * This function is called when a alink to a plugin functinality is going to be rendered.
         *
         * @return {bool} True if the plugin is visible for the site and device
         */
        isPluginVisible: function() {

            // Local notification click handler.
            if (window.plugin && window.plugin.notification && window.plugin.notification.local) {
                window.plugin.notification.local.onclick = function (id, state, json) {
                    location.href = "#events/7";
                };
            }

            return MM.util.wsAvailable('core_calendar_get_calendar_events') ||
                    MM.util.wsAvailable('local_mobile_core_calendar_get_calendar_events');
        },


        _getCalendarEventsSucces: function(response, days) {
            var daysIncrement = 90;
            var pageTitle = MM.lang.s("events") + "  " + days + " " + MM.lang.s("days");

            MM.plugins.events.lastEvents = typeof(response.events !== "undefined")? response.events : [];

            var d;
            // Formatting.
            for (var el in MM.plugins.events.lastEvents) {
                var event = MM.plugins.events.lastEvents[el];

                d = new Date(event.timestart * 1000);
                event.startdate = d.toLocaleDateString();
                event.starttime = MM.util.toLocaleTimeString(d, MM.lang.current, {hour: '2-digit', minute:'2-digit'});

                if (event.timeduration) {
                    d = new Date((event.timestart + event.timeduration) * 1000);
                    event.enddate = d.toLocaleDateString();
                    event.endtime = MM.util.toLocaleTimeString(d, MM.lang.current, {hour: '2-digit', minute:'2-digit'});
                } else {
                    event.enddate = 0;
                    event.endtime = 0;
                }

                MM.plugins.events.lastEvents[el] = event;
            }

            // Removing loading icon.
            $('a[href="' + MM.plugins.events.settings.menuURL + '"]', '#panel-left').removeClass('loading-row');

            var tpl = {events: MM.plugins.events.lastEvents};

            var html = MM.tpl.render(MM.plugins.events.templates.events.html, tpl);

            if (MM.deviceType == "tablet" && MM.plugins.events.lastEvents.length > 0) {
                MM.panels.show('center', html, {title: pageTitle});
            } else  {
                if (MM.deviceType == "tablet") {
                    MM.panels.show('center', html, {title: pageTitle, hideRight: true});
                } else {
                    MM.panels.show('center', html, {title: pageTitle});
                }
            }

            $("#events-showmore").on(MM.clickType, function(e) {
                MM.plugins.events.showEvents(days + daysIncrement);
            });
            // Load the first event.
            if (MM.deviceType == "tablet" && MM.plugins.events.lastEvents.length > 0) {
                $("#panel-center li:eq(0)").addClass("selected-row");
                MM.plugins.events.showEvent(0);
                $("#panel-center li:eq(0)").addClass("selected-row");
            }

        },

        _getCalendarEventsFailure: function(m) {
            // Removing loading icon.
            $('a[href="' + MM.plugins.events.settings.menuURL + '"]', '#panel-left').removeClass('loading-row');
            if (typeof(m) !== "undefined" && m) {
                MM.popErrorMessage(m);
            }
        },

        /**
         * Display global and course events for all the user courses
         * TODO: Support groups events also
         *
         * @param  {integer} days The number of days for displaying events starting today
         */
        showEvents: function(days) {
            MM.panels.showLoading('center');

            days = parseInt(days, 10);

            if (MM.deviceType == "tablet") {
                MM.panels.showLoading('right');
            }
            // Adding loading icon.
            $('a[href="' + MM.plugins.events.settings.menuURL + '"]', '#panel-left').addClass('loading-row');

            MM.plugins.events._getEvents(
                days,
                null,
                function(r) {
                    MM.plugins.events._getCalendarEventsSucces(r, days);
                },
                MM.plugins.events._getCalendarEventsFailure
            );
        },

        /**
         * Displays a single event information
         *
         * @param  {integer} eventId The index position in the original events array retrieved.
         */
        showEvent: function(eventId) {
            var pageTitle = MM.lang.s("events");

            if (typeof(MM.plugins.events.lastEvents[eventId]) != "undefined") {
                var fullEvent = MM.plugins.events.lastEvents[eventId];
                var course = MM.db.get("courses", MM.config.current_site.id + "-" + fullEvent.courseid);
                if (course) {
                    fullEvent.courseName = MM.util.formatText(course.get("fullname"));
                }

                var localEventId = MM.plugins.events._getLocalEventUniqueId(fullEvent);

                var tpl = {
                    "event": fullEvent
                };
                var html = MM.tpl.render(MM.plugins.events.templates.event.html, tpl);

                var title = '<div class="media"><div class="img"><img src="img/event-' + fullEvent.eventtype + '.png"></div>';
                title += '<div class="bd">' + MM.util.formatText(fullEvent.name) + '</div></div>';

                MM.panels.show('right', html, {title: title});

                var notificationTime = 60; // Default time.
                var event = MM.db.get("events", localEventId);
                if (event) {
                    notificationTime = event.get("notification");
                }
                $("#notification-time").val(notificationTime);

                $("#notification-time").bind("change", function() {

                    if (window.plugin && window.plugin.notification && window.plugin.notification.local) {
                        var disable = parseInt($(this).val(), 10) === 0;
                        if (disable) {
                            window.plugin.notification.local.cancel(localEventId);
                            MM.plugins.events._setEnabled(localEventId, false);
                        } else {
                            fullEvent.notification = parseInt($(this).val(), 10);
                            MM.plugins.events._createLocalEvent(fullEvent);
                        }
                    }
                });
            }
        },

        _getEvents: function(days, settings, successCallback, errorCallback) {
            settings = settings || null;
            // The core_calendar_get_calendar_events needs all the current user courses and groups.
            var params = {
                "options[userevents]": 1,
                "options[siteevents]": 1,
                "options[timestart]": MM.util.timestamp(),
                "options[timeend]": MM.util.timestamp() + (MM.util.SECONDS_DAY * days)
            };

            var courses = MM.db.where("courses", {siteid: MM.config.current_site.id});
            $.each(courses, function(index, course) {
                params["events[courseids][" + index + "]"] = course.get("courseid");
            });

            var groups = MM.db.where("usergroups", {site: MM.config.current_site.id, userid: MM.config.current_site.userid});
            $.each(groups, function(index, group) {
                params["events[groupids][" + index + "]"] = group.get("groupid");
            });

            var wsFunction = "core_calendar_get_calendar_events";
            if (!MM.util.wsAvailable(wsFunction)) {
                wsFunction = 'local_mobile_core_calendar_get_calendar_events';
            }

            MM.moodleWSCall(wsFunction,
                params,
                function(r) {
                    successCallback(r);
                },
                settings,
                errorCallback
            );
        },

        /**
         * We create an event Id, note that we try to make this id unique between sites but colissions may exists.
         * It must be an integer convertible value (Android limitation).
         * @param  {object} event An event object
         * @return {string}       A string convertible to number
         */
        _getLocalEventUniqueId: function(event) {
            var siteCode = MM.config.current_site.id.charCodeAt(0) + "";
            siteCode += "" + MM.config.current_site.id.charCodeAt(1);
            siteCode += "" + MM.config.current_site.id.charCodeAt(2);
            siteCode += "" + MM.config.current_site.id.charCodeAt(3);

            return siteCode + "" + event.id;
        },

        checkLocalNotifications: function() {
            // Check if the plugin is loaded.
            var enabled = MM.getConfig("event_notif_on", false);

            if (!enabled) {
                return false;
            }

            if (window.plugin && window.plugin.notification && window.plugin.notification.local) {
                // Cancell all to resync.
                var existingEvents = {};
                var events = MM.db.where("events", {'site': MM.config.current_site.id});
                _.each(events, function(e) {
                    if (e.get("enabled")) {
                        existingEvents[e.get("id")] = e;
                        MM.db.remove("events", e.get("id"));
                        window.plugin.notification.local.cancel(e.get("id"));
                    }
                });

                MM.plugins.events._getEvents(
                30,
                {
                    getFromCache: false,
                    saveToCache: true
                },
                function(events) {
                    if (events.events) {
                        _.each(events.events, function(event) {
                            var eventId = MM.plugins.events._getLocalEventUniqueId(event);

                            if (!MM.plugins.events._eventIsDisabled(eventId)) {
                                if (typeof existingEvents[eventId] != "undefined") {
                                    event.notification = parseInt(existingEvents[eventId].get("notification"), 10);
                                } else {
                                    // 60 minutes of pre-notification.
                                    event.notification = 60;
                                }
                                MM.plugins.events._createLocalEvent(event);
                            }
                        });
                    }
                },
                function() {}
            );
            }
        },

        _eventIsDisabled: function(localEventId) {
            var event = MM.db.get("events", localEventId);

            if (!event) {
                return false;
            }

            if (event.get("enabled")) {
                return false;
            }
            return true;
        },

        _setEnabled: function(localEventId, status) {
            var event = MM.db.get("events", localEventId);
            if (event) {
                event.set("enabled", status);
                if (!status) {
                    event.set("notification", 0);
                }
                MM.db.insert("events", event);
            }
        },

        _createLocalEvent: function(event) {
            var eventId = MM.plugins.events._getLocalEventUniqueId(event);
            event.notification = event.notification || 60;

            // We insert the event allways, if already exists it will be updated.
            // We discount the notification time in minutes.
            var d = new Date((event.timestart - (event.notification * 60)) * 1000);
            var realDate = new Date(event.timestart * 1000);

            window.plugin.notification.local.add(
                {
                    id: eventId,
                    date: d,
                    title: event.name,
                    message: realDate.toLocaleString(),
                    badge: 1
                }
            );
            MM.db.insert("events",
                {
                    id: eventId,
                    enabled: true,
                    notification: event.notification
                }
            );

        },

        templates: {
            "event": {
                html: eventTpl
            },
            "events": {
                html: eventsTpl
            }
        }

    };

    MM.registerPlugin(plugin);

});