var templates = [
    "root/externallib/text!root/plugins/forum/view.html"
];

define(templates, function (filesTpl) {
    var plugin = {
        settings: {
            name: "forum",
            type: "mod",
            component: "mod_forum",
            lang: {
                component: "core"
            }
        },

        routes: [
            ["forum/view/:courseId/:cmid", "view_forum", "viewForum"],
        ],

        render: function(courseId, sectionId, section, module) {
            var data = {
                "courseId": courseId,
                "sectionId": sectionId,
                "section": section,
                "module": module
            };
            return MM.tpl.render(MM.plugins.forum.templates.view.html, data);
        },

        /**
         * Display a forum and discussions
         * @param  {Number} cmid The course module number id
         *
         */
        viewForum: function(courseId, cmid) {
            // First, load the complete information of forums in this course.
            //MM.panels.show('right', html, {title: pageTitle});
        },

        templates: {
            "view": {
                html: filesTpl
            }
        }

    };

    MM.registerPlugin(plugin);

});