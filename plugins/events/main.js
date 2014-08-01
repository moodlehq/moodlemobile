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
                event.starttime = d.toLocaleTimeString(navigator.language, {hour: '2-digit', minute:'2-digit'});

                if (event.timeduration) {
                    d = new Date((event.timestart + event.timeduration) * 1000);
                    event.enddate = d.toLocaleDateString();
                    event.endtime = d.toLocaleTimeString(navigator.language, {hour: '2-digit', minute:'2-digit'});
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

            MM.panels.show('center', html, {title: pageTitle});
            $("#events-showmore").on(MM.clickType, function(e) {
                MM.plugins.events.showEvents(days + daysIncrement);
            });
            // Load the first user
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

            var wsFunction = "core_calendar_get_calendar_events";
            if (!MM.util.wsAvailable(wsFunction)) {
                wsFunction = 'local_mobile_core_calendar_get_calendar_events';
            }

            MM.moodleWSCall(wsFunction,
                params,
                function(r) {
                    MM.plugins.events._getCalendarEventsSucces(r, days)
                },
                null,
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
                var tpl = {"event": fullEvent};
                var html = MM.tpl.render(MM.plugins.events.templates.event.html, tpl);
                MM.panels.show('right', html, {title: pageTitle});
            }
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