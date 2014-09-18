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

        templates: {
            "view": {
                html: filesTpl
            }
        }

    };

    MM.registerPlugin(plugin);

});