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

        viewActivities: function(courseId) {

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
                MM.panels.show("center", html, {title: MM.lang.s("grades"), hideRight: true});
            });
        },

        templates: {
            "activities": {
                html: activities
            }
        }
    };

    MM.registerPlugin(plugin);
});