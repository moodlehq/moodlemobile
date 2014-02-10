var templates = [
    "root/externallib/text!root/plugins/participants/participants.html",
    "root/externallib/text!root/plugins/participants/participant.html"
];

define(templates,function (participantsTpl, participantTpl) {
    var plugin = {
        settings: {
            name: "participants",
            type: "course",
            menuURL: "#participants/",
            lang: {
                component: "core"
            },
            icon: ""
        },

        storage: {
            participant: {type: "model"},
            participants: {type: "collection", model: "participant"}
        },

        routes: [
            ["participants/:courseId", "participants", "showParticipants"],
            ["participant/:courseId/:userId", "participants", "showParticipant"],
        ],


        showParticipants: function(courseId) {
            MM.panels.showLoading('center');

            if (MM.deviceType == "tablet") {
                MM.panels.showLoading('right');
            }
            // Adding loading icon.
            $('a[href="#participants/' +courseId+ '"]').addClass('loading-row');

            var data = {
                "courseid" : courseId
            };

            MM.moodleWSCall('moodle_user_get_users_by_courseid', data, function(users) {
                // Removing loading icon.
                $('a[href="#participants/' +courseId+ '"]').removeClass('loading-row');
                var tpl = {users: users, deviceType: MM.deviceType, courseId: courseId};
                var html = MM.tpl.render(MM.plugins.participants.templates.participants.html, tpl);

                var course = MM.db.get("courses", MM.config.current_site.id + "-" + courseId);
                var pageTitle = course.get("shortname") + " - " + MM.lang.s("participants");

                MM.panels.show('center', html, {title: pageTitle});
                // Load the first user
                if (MM.deviceType == "tablet" && users.length > 0) {
                    $("#panel-center li:eq(0)").addClass("selected-row");
                    MM.plugins.participants.showParticipant(courseId, users.shift().id);
                    $("#panel-center li:eq(0)").addClass("selected-row");
                }
            }, null, function(m) {
                // Removing loading icon.
                $('a[href="#participants/' +courseId+ '"]').removeClass('loading-row');
                if (typeof(m) !== "undefined" && m) {
                    MM.popErrorMessage(m);
                }
            });
        },

        showParticipant: function(courseId, userId) {
            var data = {
                "userlist[0][userid]": userId,
                "userlist[0][courseid]": courseId
            }
            MM.moodleWSCall('moodle_user_get_course_participants_by_id', data, function(users) {
                // Load the active user plugins.

                var userPlugins = [];
                for (var el in MM.plugins) {
                    var plugin = MM.plugins[el];
                    if (plugin.settings.type == "user") {
                        if (typeof(plugin.isPluginVisible) == 'function' && !plugin.isPluginVisible()) {
                            continue;
                        }
                        userPlugins.push(plugin.settings);
                    }
                }

                var newUser = users.shift();

                var course = MM.db.get("courses", MM.config.current_site.id + "-" + courseId);
                var pageTitle = course.get("shortname") + " - " + MM.lang.s("participants");

                var tpl = {"user": newUser, "plugins": userPlugins, "courseid": courseId};
                var html = MM.tpl.render(MM.plugins.participants.templates.participant.html, tpl);
                newUser.id = MM.config.current_site.id + "-" + newUser.id;
                MM.db.insert("users", newUser);
                MM.panels.show('right', html, {title: pageTitle});
            });
        },


        templates: {
            "participant": {
                model: "participant",
                html: participantTpl
            },
            "participants": {
                html: participantsTpl
            }
        }
    }

    MM.registerPlugin(plugin);
});