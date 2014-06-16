var templates = [
    "root/externallib/text!root/plugins/courses/courses.html"
];

define(templates,function (coursesTpl) {
    var plugin = {
        settings: {
            name: "courses",
            type: "general",
            menuURL: "#courses/",
            icon: "plugins/courses/icon.png",
            lang: {
                component: "core"
            }
        },

        routes: [
            ["courses/", "courses_view", "viewCourses"]
        ],

        viewCourses: function() {

            MM.panels.showLoading('center');

            if (MM.deviceType == "tablet") {
                MM.panels.html('right', '');
            }

            MM.moodleWSCall(
                method          = 'moodle_enrol_get_users_courses',
                data            = {userid: MM.site.get('userid')},
               function(courses) {

var plugins = [];
        var coursePlugins = [];

        for (var el in MM.config.plugins) {
            var index = MM.config.plugins[el];
            var plugin = MM.plugins[index];
            if (typeof plugin == 'undefined') {
                continue;
            }
            // Check if the plugin is Visible.
            // If the iPluginVisible function is undefined, we assume the plugin is visible without additional checks.
            if (typeof(plugin.isPluginVisible) == 'function' && !plugin.isPluginVisible()) {
                continue;
            }
            if (plugin.settings.type == 'general') {
                plugins.push(plugin.settings);
            } else if (plugin.settings.type == 'course') {
                coursePlugins.push(plugin.settings);
            }
        }

        // Prepare info for loading main menu.
        values = {
            user: {
                fullname: MM.site.get('fullname'),
                profileimageurl: MM.site.get('userpictureurl')
            },
            siteurl: MM.site.get('siteurl'),
            coursePlugins: coursePlugins,
            courses: courses,
            plugins: plugins
        };

                    var html = MM.tpl.render(MM.plugins.courses.templates.courses.html, values);
                    MM.panels.show("center", html, {title: "Courses"});
                    if (MM.deviceType == "tablet") {
                        MM.plugins.contents.viewCourseContentsSection(courses[0].id, -1);
                    }
                },
                preSets         = {omitExpires: true},
                errorCallBack   = MM.showAddSitePanel
            );

        },

        templates: {
            "courses": {
                html: coursesTpl
            }
        }
    };

    MM.registerPlugin(plugin);
});