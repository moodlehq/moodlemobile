var templates = [
    "root/externallib/text!root/plugins/assign/view.html"
];

define(templates, function (assignTpl) {
    var plugin = {
        settings: {
            name: "assign",
            type: "mod",
            component: "mod_assign",
            lang: {
                component: "core"
            }
        },

        storage: {
            "assign_file": {type: "model"},
            "assign_files": {type: "collection", model: "assign_file"}
        },

        routes: [
            ["assign/view/:courseId/:cmid", "view_assign", "viewAssign"]
        ],

        sectionsCache: [],

         /**
         * Determines is the plugin is visible.
         * It may check Moodle remote site version, device OS, device type, etc...
         * This function is called when a alink to a plugin functinality is going to be rendered.
         *
         * @return {bool} True if the plugin is visible for the site and device
         */
        isPluginVisible: function() {
            // Check core services.
            var visible =   MM.util.wsAvailable('mod_assign_get_assignments') &&
                            MM.util.wsAvailable('mod_assign_get_submissions');

            return visible;
        },

        render: function(courseId, sectionId, section, module) {
            var data = {
                "courseId": courseId,
                "sectionId": sectionId,
                "section": section,
                "module": module
            };
            // Store the section name.
            MM.plugins.assign.sectionsCache[module.contentid] = MM.util.formatText(section.name);

            return MM.tpl.render(MM.plugins.assign.templates.view.html, data);
        },

        perPage: 20,

        /**
         * Display a assign
         * @param  {Number} cmid The course module number id
         *
         */
        viewAssign: function(courseId, cmid) {
            // Loading ....
            $("#info-" + cmid, "#panel-right").attr("src", "img/loadingblack.gif");

            // First, load the complete information of assigns in this course.
            var params = {
                "courseids[0]": courseId
            };

            MM.moodleWSCall("mod_assign_get_assignments",
                params,
                function(result) {
                    var course = result.courses.shift();
                    var currentAssign;
                    _.each(course.assignments, function(assign) {
                        if (assign.cmid == cmid) {
                            currentAssign = assign;
                        }
                    });
                    console.log(currentAssign);
                },
                null,
                function (error) {
                    $("#info-" + cmid, "#panel-right").attr("src", "img/info.png");
                    MM.popErrorMessage(error);
                }
            );
        },

        templates: {
            "view": {
                html: assignTpl
            }
        }

    };

    MM.registerPlugin(plugin);

});