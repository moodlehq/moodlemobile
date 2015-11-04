var templates = [
    "root/externallib/text!root/plugins/participants/participants.html",
    "root/externallib/text!root/plugins/participants/participant.html",
    "root/externallib/text!root/plugins/participants/participants_row.html",
    "root/externallib/text!root/plugins/participants/countries.json"
];

define(templates,function (participantsTpl, participantTpl, participantsRowTpl, countriesJSON) {
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
            ["participant/:courseId/:userId/:popup", "participants_pop", "showParticipant"],
        ],

        limitNumber: 100,

        showParticipants: function(courseId) {
            MM.panels.showLoading('center');

            if (MM.deviceType == "tablet") {
                MM.panels.showLoading('right');
            }
            // Adding loading icon.
            $('a[href="#participants/' +courseId+ '"]').addClass('loading-row');

            MM.plugins.participants._loadParticipants(courseId, 0, MM.plugins.participants.limitNumber,
                function(users) {
                    // Removing loading icon.
                    $('a[href="#participants/' +courseId+ '"]').removeClass('loading-row');

                    var showMore = true;
                    if (users.length < MM.plugins.participants.limitNumber) {
                        showMore = false;
                    }

                    MM.plugins.participants.nextLimitFrom = MM.plugins.participants.limitNumber;

                    var tpl = {
                        users: users,
                        deviceType: MM.deviceType,
                        courseId: courseId,
                        showMore: showMore
                    };
                    var html = MM.tpl.render(MM.plugins.participants.templates.participants.html, tpl);

                    var course = MM.db.get("courses", MM.config.current_site.id + "-" + courseId);
                    var pageTitle = "";

                    if (course) {
                        pageTitle = course.get("shortname");;
                    }

                    MM.panels.show('center', html, {title: pageTitle});

                    // Load the first user
                    if (MM.deviceType == "tablet" && users.length > 0) {
                        $("#panel-center li:eq(0)").addClass("selected-row");
                        MM.plugins.participants.showParticipant(courseId, users.shift().id);
                        $("#panel-center li:eq(0)").addClass("selected-row");
                    }

                    // Save the users in the users table.
                    var newUser;
                    users.forEach(function(user) {
                        newUser = {
                            'id': MM.config.current_site.id + '-' + user.id,
                            'userid': user.id,
                            'fullname': user.fullname,
                            'profileimageurl': user.profileimageurl
                        };
                        MM.db.insert('users', newUser);
                    });

                    // Show more button.
                    $("#participants-showmore").on(MM.clickType, function(e) {
                        var that = $(this);
                        $(this).addClass("loading-row-black");

                        MM.plugins.participants._loadParticipants(
                            courseId,
                            MM.plugins.participants.nextLimitFrom,
                            MM.plugins.participants.limitNumber,
                            function(users) {
                                that.removeClass("loading-row-black");
                                MM.plugins.participants.nextLimitFrom += MM.plugins.participants.limitNumber;

                                var tpl = {courseId: courseId, users: users};
                                var newUsers = MM.tpl.render(MM.plugins.participants.templates.participantsRow.html, tpl);
                                $("#participants-additional").append(newUsers);
                                if (users.length < MM.plugins.participants.limitNumber) {
                                    that.css("display", "none");
                                }
                            },
                            function() {
                                that.removeClass("loading-row-black");
                            }
                        );
                    });

                }, function(m) {
                    // Removing loading icon.
                    $('a[href="#participants/' +courseId+ '"]').removeClass('loading-row');
                    if (typeof(m) !== "undefined" && m) {
                        MM.popErrorMessage(m);
                    }
                }
            );
        },

        _loadParticipants: function(courseId, limitFrom, limitNumber, successCallback, errorCallback) {
            var data = {
                "courseid" : courseId,
                "options[0][name]" : "limitfrom",
                "options[0][value]": limitFrom,
                "options[1][name]" : "limitnumber",
                "options[1][value]": limitNumber,
            };

            MM.moodleWSCall(
                'moodle_user_get_users_by_courseid',
                data,
                function(users) {
                    successCallback(users);
                },
                {
                    logging: {
                        method: 'core_user_view_user_list',
                        data: {
                            courseid: courseId
                        }
                    }
                },
                function(m) {
                    errorCallback(m);
                }
            );
        },

        showParticipant: function(courseId, userId, popUp) {
            popUp = popUp || false;

            var menuEl = 'a[href="#participant/' + courseId + '/' + userId + '"]';
            $(menuEl, '#panel-center').addClass('loading-row-black');

            var data = {
                "userlist[0][userid]": userId,
                "userlist[0][courseid]": courseId
            };
            MM.moodleWSCall(
                'moodle_user_get_course_participants_by_id',
                data,
                function(users) {
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
                    var pageTitle = "";
                    if (course) {
                        pageTitle = MM.lang.s("participant");
                    }

                    var countries = JSON.parse(MM.plugins.participants.templates.countries.json);
                    if (newUser.country && typeof countries[newUser.country] != "undefined") {
                        newUser.country = countries[newUser.country];
                    }

                    var tpl = {
                        "user": newUser,
                        "plugins": userPlugins,
                        "courseid": courseId,
                        "popUp": popUp
                    };

                    var html = MM.tpl.render(MM.plugins.participants.templates.participant.html, tpl);
                    newUser.id = MM.config.current_site.id + "-" + newUser.id;
                    MM.db.insert("users", newUser);

                    $(menuEl, '#panel-center').removeClass('loading-row-black');
                    MM.panels.show('right', html, {title: pageTitle});
                },
                {
                    logging: {
                        method: 'core_user_view_user_profile',
                        data: {
                            courseid: courseId,
                            userid: userId
                        }
                    }
                }
            );
        },

        /**
         * Check if we can show the grades button for this user.
         * @param  {integer} courseId The course id
         * @param  {integer} userId   The user Id
         * @return {boolean}          True or false
         */
        _showGrades: function(courseId, userId) {
            if (MM.plugins.grades.wsName == 'local_mobile_gradereport_user_get_grades_table') {
                return true;
            }
            return false;
        },

        templates: {
            "participant": {
                model: "participant",
                html: participantTpl
            },
            "participants": {
                html: participantsTpl
            },
            "participantsRow": {
                html: participantsRowTpl
            },
            "countries": {
                json: countriesJSON
            }
        }
    }

    MM.registerPlugin(plugin);
});