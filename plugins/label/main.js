var templates = [
    "root/externallib/text!root/plugins/label/view.html"
];

define(templates, function (filesTpl) {
    var plugin = {
        settings: {
            name: "label",
            type: "mod",
            component: "mod_label",
            lang: {
                component: "core"
            }
        },

        render: function(courseId, sectionId, section, module) {
            var data = {
                "courseId": courseId,
                "sectionId": sectionId,
                "section": section,
                "module": module
            };
            return MM.tpl.render(MM.plugins.label.templates.view.html, data);
        },

        /**
         * Callback executed when the contents page is rendered.
         */
        contentsPageRendered: function() {
            // Show/hide labels.
            $(".action-label").on(MM.clickType, function(e) {
                e.preventDefault();

                var contentId = $(this).data("contentid");
                var courseId = $(this).data("courseid");
                var content = MM.db.get("contents", MM.config.current_site.id + "-" + contentId);
                content = content.toJSON();

                if ($(this).hasClass("expand-label")) {
                    if (content.description) {
                        content.description = MM.util.formatText(content.description, false, courseId);
                        $(this).html(content.description);
                        MM.handleExternalLinks('#link-' + contentId + ' a[target="_blank"]');
                    }
                } else {
                    $(this).html("<h3>" + content.name + "</h3>");
                }
                $(this).toggleClass("collapse-label expand-label");
            });
        },

        templates: {
            "view": {
                html: filesTpl
            }
        }

    };

    MM.registerPlugin(plugin);

});