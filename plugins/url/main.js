var templates = [
    "root/externallib/text!root/plugins/url/view.html"
];

define(templates, function (filesTpl) {
    var plugin = {
        settings: {
            name: "url",
            type: "mod",
            component: "mod_url",
            lang: {
                component: "core"
            }
        },

        render: function(courseId, sectionId, section, module) {
            // Missing instance? (Possible in older Moodle versions).
            if (typeof module.instance == "undefined") {
                module.instance = 0;
            }

            var data = {
                "courseId": courseId,
                "sectionId": sectionId,
                "section": section,
                "module": module
            };
            return MM.tpl.render(MM.plugins.url.templates.view.html, data);
        },

        templates: {
            "view": {
                html: filesTpl
            }
        },

        /**
         * Callback executed when the contents resource is rendered.
         */
        contentsPageRendered: function() {

            // Logging.
             $(".content-name.mod-url a").on(MM.clickType, function(e) {
                var instance = $(this).data("instance");
                if (parseInt(instance) > 0) {
                    MM.moodleLogging(
                        'mod_url_view_url',
                        {
                            urlid: instance
                        },
                        function() {
                            MM.cache.invalidate();
                        }
                    );
                }
            });
        },

    };

    MM.registerPlugin(plugin);

});