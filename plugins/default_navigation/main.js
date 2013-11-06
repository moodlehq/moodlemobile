var templates = [
    "root/externallib/text!root/plugins/default_navigation/template.html"
];

require(templates, function(navTpl) {
    var plugin = {
        settings: {
            name: "default_navigation",
            type: "menu",
            menuURL: "#",
            lang: {
                component: "core"
            }
        },

        templates:{
            side_nav:navTpl
        },

        courses:undefined,

        /**
         * Sets up the top bar navigation.
         */
        init: function() {

        },

        _loadCourses: function(courses) {
            MM.plugins.default_navigation.courses = courses;

            // Store the courses
            for (var el in courses) {
                // We clone the course object because we are going to modify
                // it in a copy.
                var storedCourse = JSON.parse(JSON.stringify(courses[el]));
                storedCourse.courseid = storedCourse.id;

                // For avoid collising between sites.
                storedCourse.id = MM.config.current_site.id + '-' + storedCourse.courseid;
                var r = MM.db.insert('courses', storedCourse);
            }

            $(document).trigger('default_navigation:courses_loaded');
        },

        _getCourses: function() {
            MM.plugins.default_navigation.courses = [];

            // For loading a site, we need the list of courses.
            MM.moodleWSCall(
                method          = 'moodle_enrol_get_users_courses',
                data            = {userid: MM.site.get('userid')},
                callBack        = MM.plugins.default_navigation._loadCourses,
                preSets         = {omitExpires: true},
                errorCallBack   = MM.showAddSitePanel
            );
        },

        // Creates and shows the side menu.
        show: function() {
            if (MM.plugins.default_navigation.courses === undefined) {
                $(document).on(
                    'default_navigation:courses_loaded',
                    MM.plugins.default_navigation.show
                );
                MM.plugins.default_navigation._getCourses();
            } else {
                $(document).off('default_navigation:courses_loaded');
                var plugins = [];
                var coursePlugins = [];

                for (var el in MM.config.plugins) {
                    var index = MM.config.plugins[el];
                    var plugin = MM.plugins[index];
                    if (typeof plugin == 'undefined') {
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
                    courses:MM.plugins.default_navigation.courses,
                    plugins: plugins
                };

                // Load the main menu template.
                var output = MM.tpl.render(
                    MM.plugins.default_navigation.templates.side_nav, values
                );
                MM.panels.html('left', output);

                $('.submenu').hide();
                $('.toogler').bind(MM.clickType, function(e) {
                    // This prevents open the toogler when we are scrolling.
                    if (MM.touchMoving) {
                        MM.touchMoving = false;
                    } else {
                        $(this).next().slideToggle(300);
                        $(this).toggleClass("collapse expand");
                    }
                });
            }
        }
    };

    MM.registerPlugin(plugin);
});