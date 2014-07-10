var templates = [
    "root/externallib/text!root/plugins/grades/activities.html"
];

define(templates,function (activities) {
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
                var html = MM.tpl.render(MM.plugins.grades.templates.activities.html, tpl);

                $(menuEl, '#panel-left').removeClass('loading-row');
                MM.panels.show("center", html, {title: MM.lang.s("grades"), hideRight: true});

                var id;
                // Now, load grades for all the elements
                $(".grade").each(function() {
                    id = $(this).attr("id");
                    if (id) {
                        MM.plugins.grades._getGradeForActivity(id);
                    }
                });
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

                            percentage = ((numGrade - min) * 100) / (max - min);
                            percentage += " %";
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
                function() {
                    var error = MM.lang.s("errorretrievinggradeinformation");
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
            }
        }
    };

    MM.registerPlugin(plugin);
});