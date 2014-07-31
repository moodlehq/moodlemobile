var templates = [
    "root/externallib/text!root/plugins/myfiles/files.html"
];

define(templates, function (filesTpl) {
    var plugin = {
        settings: {
            name: "myfiles",
            type: "general",
            icon: "plugins/myfiles/icon.png",
            menuURL: "#myfiles/root",
            lang: {
                component: "core"
            }
        },

        routes: [
            ["myfiles/:dir", "show_files", "showFiles"],
        ],

        path: [],

        /**
         * Determines is the plugin is visible.
         * It may check Moodle remote site version, device OS, device type, etc...
         * This function is called when a alink to a plugin functinality is going to be rendered.
         *
         * @return {bool} True if the plugin is visible for the site and device
         */
        isPluginVisible: function() {
            return MM.util.wsAvailable('local_mobile_core_files_get_files');
        },

        /**
         * Display global and course files for all the user courses
         * TODO: Support groups files also
         *
         * @param  {integer} days The number of days for displaying files starting today
         */
        showFiles: function(dir) {
            var pageTitle, html;
            var params = {
                "contextid": 0,
                "component": "",
                "filearea": "",
                "itemid": 0,
                "filepath": "",
                "filename": ""
            };

            var data = {
                backPath: "",
                dir: dir,
                entries: []
            };

            if (dir == "root") {
                MM.plugins.myfiles.path = [MM.lang.s("myfiles")];
                html = MM.tpl.render(MM.plugins.myfiles.templates.files.html, data);
                pageTitle = MM.plugins.myfiles.path.join(" / ");
                MM.panels.show('center', html, {title: pageTitle});
                return;

            } else if (dir == "private") {
                MM.plugins.myfiles.path = [MM.lang.s("myfiles")];
                MM.plugins.myfiles.path.push(MM.lang.s("privatefiles"));

                data.backPath = "root";

            } else if (dir == "site") {
                MM.plugins.myfiles.path = [MM.lang.s("myfiles")];
                MM.plugins.myfiles.path.push(MM.lang.s("sitefiles"));

                data.backPath = "root";
            }

            MM.moodleWSCall("local_mobile_core_files_get_files",
                params,
                function(result) {
                    if (typeof result.files == "undefined") {
                        MM.popErrorMessage(MM.lang.s("errorlistingfiles"));
                        return;
                    }
                    data.entries = result.files;
                },
                null,
                function (error) {
                    MM.popErrorMessage(error);
                }
            );

            html = MM.tpl.render(MM.plugins.myfiles.templates.files.html, data);
            pageTitle = MM.plugins.myfiles.path.join(" / ");
            MM.panels.show('center', html, {title: pageTitle});
        },

        templates: {
            "files": {
                html: filesTpl
            }
        }

    };

    MM.registerPlugin(plugin);

});