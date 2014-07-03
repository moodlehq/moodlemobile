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
            return MM.util.wsAvailable('core_grades_get_grades') ||
                    MM.util.wsAvailable('local_mobile_core_grades_get_grades');
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