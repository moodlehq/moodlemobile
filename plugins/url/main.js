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
        }

    };

    MM.registerPlugin(plugin);

});