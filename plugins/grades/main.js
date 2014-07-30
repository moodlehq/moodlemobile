var templates = [
    "root/externallib/text!root/plugins/grades/activities.html",
    "root/externallib/text!root/plugins/grades/activities_total.html"
];

define(templates,function (activities, activitiesTotal) {
    var plugin = {
        settings: {
            name: "grades",
            type: "course",
            menuURL: "#course/grades/",
            lang: {
                component: "core"
            }
        },

        routes: [
            ["course/grades/:courseid", "course_grades_activities", "viewActivities"]
        ],

        isPluginVisible: function() {
            // We store the WSName for later.
            // Since there is a but in the core_grades_get_grades we only allow to use the local_mobile plugin one.
            if (MM.util.wsAvailable('local_mobile_core_grades_get_grades')) {
                MM.plugins.grades.wsName = 'local_mobile_core_grades_get_grades';
                return true;
            }
            return false;
        },

        viewActivities: function(courseId) {

            // Adding loading icon.
            var menuEl = 'a[href="#course/grades/' + courseId + '"]';
            $(menuEl, '#panel-left').addClass('loading-row');

            MM.panels.showLoading('center');

            var data = {
                "options[0][name]" : "",
                "options[0][value]" : ""
            };
            data.courseid = courseId;

            MM.moodleWSCall('core_course_get_contents', data, function(contents) {
                var course = MM.db.get("courses", MM.config.current_site.id + "-" + courseId);

                var tpl = {
                    sections: contents,
                    course: course.toJSON() // Convert a model to a plain javascript object.
                };

                // Now, this is a dirty hack necessary.
                // Depending on the local mobile version we can retrieve all the grades with the course total or
                // we should ask grade by grade
                var unsupportedVersions = ["2014052805", "2014060200", "2014060300", "2014060400", "2014060401", "2014052806",
                                            "2014060201", "2014060301", "2014060402"];

                // Check local_mobile version.
                var currentVersion = MM.util.wsVersion("local_mobile_core_grades_get_grades");
                if (unsupportedVersions.indexOf(currentVersion) == -1) {
                    MM.plugins.grades._loadAllGrades(tpl, menuEl);
                } else {
                    MM.plugins.grades._loadGradeByGrade(tpl);
                    $(menuEl, '#panel-left').removeClass('loading-row');
                }
            });
        },

        _loadAllGrades: function(tpl, menuEl) {

            var data = {
                "courseid" : tpl.course.courseid,
                "userids[0]" : MM.config.current_site.userid
            };

            MM.moodleWSCall(MM.plugins.grades.wsName, data,
                // Succes callback.
                function(grades) {

                    // Now we should create a correct data structure for the grades.
                    var userGrades = {};

                    if (grades.items && grades.items.length > 0) {
                        _.each(grades.items, function(item) {
                            userGrades[item.activityid] = item;
                            userGrades[item.activityid].user = [];
                            if (item.grades && item.grades.length > 0) {
                                _.each(item.grades, function(userGrade) {
                                    userGrades[item.activityid].user[userGrade.userid] = {grade: null, outcome: null};
                                    userGrades[item.activityid].user[userGrade.userid]["grade"] = userGrade;
                                });
                            }
                        });
                    }

                    if (grades.outcomes && grades.outcomes.length > 0) {
                        _.each(grades.outcomes, function(outcome) {
                            if (!userGrades[outcome.activityid]) {
                                userGrades[outcome.activityid] = outcome;
                                userGrades[outcome.activityid].user = [];
                            }
                            if (outcome.grades && outcome.grades.length > 0) {
                                _.each(outcome.grades, function(userGrade) {
                                    if (typeof userGrades[outcome.activityid].user[userGrade.userid] == "undefined") {
                                        userGrades[outcome.activityid].user[userGrade.userid] = {grade: null, outcome: null};
                                    }
                                    userGrades[outcome.activityid].user[userGrade.userid]["outcome"] = userGrade;
                                });
                            }
                        });
                    }

                    // Add a section for the course total.
                    var newModule = userGrades["course"];
                    newModule.id = "course";

                    var newSection = {
                        id: "course",
                        name: MM.util.formatText(tpl.course.fullname),
                        modules: [newModule]
                    };
                    tpl.sections.push(newSection);

                    // Final data structure with the sections to display.
                    var finalSections = {};
                    var userId = MM.config.current_site.userid;

                    _.each(tpl.sections, function(section) {
                        if (typeof(section.modules) != "undefined" && section.modules.length > 0) {
                            _.each(section.modules, function(module) {
                                if (typeof userGrades[module.id] != "undefined") {
                                    if (typeof finalSections[section.id] == "undefined") {
                                        newSection = {
                                            id: section.id,
                                            name: section.name,
                                            modules: []
                                        };
                                        finalSections[section.id] = newSection;
                                    }
                                    module.grade = {
                                        grade: "-",
                                        range: "-",
                                        percentage: "-",
                                        feedback: "-"
                                    };

                                    var min = userGrades[module.id]["grademin"];
                                    var max = userGrades[module.id]["grademax"];
                                    if (min || max) {
                                        module.grade.range = min + " - " + max;
                                    }

                                    if (typeof userGrades[module.id].user[userId] != "undefined" &&
                                            userGrades[module.id].user[userId].grade) {

                                        gradeInfo = userGrades[module.id].user[userId].grade;

                                        module.grade.grade = gradeInfo["str_long_grade"];
                                        module.grade.feedback = MM.util.formatText(gradeInfo["str_feedback"], true);
                                        numGrade = gradeInfo["grade"];

                                        var div = max - min;
                                        if (numGrade && div) {
                                            module.grade.percentage = ((numGrade - min) * 100) / (div);
                                            module.grade.percentage += " %";
                                        }
                                    }

                                    finalSections[section.id].modules.push(module);
                                }
                            });
                        }
                    });

                    $(menuEl, '#panel-left').removeClass('loading-row');

                    tpl.sections = finalSections;
                    var html = MM.tpl.render(MM.plugins.grades.templates.activitiesTotal.html, tpl);
                    MM.panels.show("center", html, {title: MM.lang.s("grades"), hideRight: true});
                },
                {},
                // Error callback.
                function(e) {
                    MM.plugins.grades._loadGradeByGrade(tpl);
                }
            );
        },

        _loadGradeByGrade: function(tpl) {
            var html = MM.tpl.render(MM.plugins.grades.templates.activities.html, tpl);

            MM.panels.show("center", html, {title: MM.lang.s("grades"), hideRight: true});

            var id;
            // Now, load grades for all the elements
            $(".grade").each(function() {
                id = $(this).attr("id");
                if (id) {
                    MM.plugins.grades._getGradeForActivity(id);
                }
            });
        },

        _getGradeForActivity: function(id) {

            var info = id.split("-");

            var data = {
                "courseid" : parseInt(info[3]),
                "component" : "mod_" + info[4],
                "activityid" : parseInt(info[5]),
                "userids[0]" : MM.config.current_site.userid
            };

            var grade = "--";
            var range = "--";
            var percentage = "--";
            var feedback = "--";

            MM.moodleWSCall(MM.plugins.grades.wsName, data,
                // Succes callback.
                function(contents) {

                    if (contents.items && contents.items[0]) {
                        var min = contents.items[0]["grademin"];
                        var max = contents.items[0]["grademax"];
                        range = min + " - " + max;

                        if (contents.items[0]["grades"] && contents.items[0]["grades"][0]) {
                            gradeInfo = contents.items[0]["grades"][0];

                            grade = gradeInfo["str_long_grade"];
                            feedback = MM.util.formatText(gradeInfo["str_feedback"], true);
                            numGrade = gradeInfo["grade"];

                            var div = max - min;
                            if (numGrade && div) {
                                percentage = ((numGrade - min) * 100) / (div);
                                percentage += " %";
                            }
                        }
                    }

                    if (contents.outcomes && contents.outcomes[0] &&
                        contents.outcomes[0]["grades"] && contents.outcomes[0]["grades"][0]) {
                        var strGrade = contents.outcomes[0]["grades"][0]["str_grade"];
                        grade += " (" + strGrade + ")";
                    }

                    $("#" + id).html(grade);
                    $("#" + id.replace("-grade-", "-range-")).html(range);
                    $("#" + id.replace("-grade-", "-percentage-")).html(percentage);
                    $("#" + id.replace("-grade-", "-feedback-")).html(feedback);

                },
                {},
                // Error callback.
                function(e) {
                    var error;

                    if (typeof e == "string") {
                        error = e;
                    } else {
                        error = MM.lang.s("errorretrievinggradeinformation");
                    }
                    $("#" + id).html(error);
                    $("#" + id.replace("-grade-", "-range-")).html(error);
                    $("#" + id.replace("-grade-", "-percentage-")).html(error);
                    $("#" + id.replace("-grade-", "-feedback-")).html(error);
                }
            );

        },

        templates: {
            "activities": {
                html: activities
            },
            "activitiesTotal": {
                html: activitiesTotal
            }
        }
    };

    MM.registerPlugin(plugin);
});