var templates = [
    "root/externallib/text!root/plugins/grades/activities.html",
    "root/externallib/text!root/plugins/grades/activitygrade.html",
    "root/externallib/text!root/plugins/grades/lang/en.json"
];

define(templates,function (activities, activityGrade, langStrings) {
    var plugin = {
        settings: {
            name: "grades",
            type: "course",
            menuURL: "#course/grades/",
            lang: {
                component: "local_custommm",
                strings: langStrings
            }
        },

        routes: [
            ["course/grades/:courseid", "course_grades_activities", "viewActivities"],
            ["course/grades/activity/:activityname/:courseid/:modname/:cmid", "course_grades_activitygrade", "viewActivityGrade"]
        ],

        viewActivities: function(courseId) {

            MM.panels.showLoading('center');

            if (MM.deviceType == "tablet") {
                MM.panels.html('right', '');
            }

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
                }
                var html = MM.tpl.render(MM.plugins.grades.templates.activities.html, tpl);
                MM.panels.show("center", html);
            });
        },


        viewActivityGrade: function(activityName, courseId, modName, cmId) {


            if (MM.deviceType == "tablet") {
                MM.panels.showLoading('right');
            }

            var html = MM.tpl.render(MM.plugins.grades.templates.activityGrade.html, {});
            MM.panels.show("right", html);

        },

        templates: {
            "activities": {
                html: activities
            },
            "activityGrade": {
                html: activityGrade
            }
        }
    }

    MM.registerPlugin(plugin);
});