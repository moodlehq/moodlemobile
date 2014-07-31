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
         *
         * @param  {string} dir The directory to show
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
                goBack: true,
                dir: dir,
                entries: []
            };

            if (dir == "root") {
                data.goBack = false;

                MM.plugins.myfiles.path = [MM.lang.s("myfiles")];
                html = MM.tpl.render(MM.plugins.myfiles.templates.files.html, data);
                pageTitle = MM.plugins.myfiles.path.join(" / ");
                MM.panels.show('center', html, {title: pageTitle});
                return;

            } else if (dir == "private") {
                MM.plugins.myfiles.path = [MM.lang.s("myfiles")];
                MM.plugins.myfiles.path.push(MM.lang.s("privatefiles"));

                params.component = "user";
                params.filearea = "private";
                params.contextid = -1;
                params.contextlevel = "user";
                params.instanceid = MM.config.current_site.userid;

            } else if (dir == "site") {
                MM.plugins.myfiles.path = [MM.lang.s("myfiles")];
                MM.plugins.myfiles.path.push(MM.lang.s("sitefiles"));

            } else {
                try {
                    params = JSON.parse(dir);
                } catch(e) {
                    MM.popErrorMessage(MM.lang.s("errorlistingfiles"));
                    return;
                }
            }

            MM.moodleWSCall("local_mobile_core_files_get_files",
                params,
                function(result) {
                    if (typeof result.files == "undefined") {
                        MM.popErrorMessage(MM.lang.s("errorlistingfiles"));
                        return;
                    }
                    _.each(result.files, function(entry) {
                        entry.link = {};
                        entry.link.contextid = (entry.contextid) ? entry.contextid : "";
                        entry.link.component = (entry.component) ? entry.component : "";
                        entry.link.filearea = (entry.filearea) ? entry.filearea : "";
                        entry.link.itemid = (entry.itemid) ? entry.itemid : 0;
                        entry.link.filepath = (entry.filepath) ? entry.filepath : "";
                        entry.link.filename = (entry.filename) ? entry.filename : "";
                        if (entry.component && entry.isdir) {
                            // Delete unused elements that may broke the request.
                            entry.link.filename = "";
                        }

                        if (entry.isdir) {
                            entry.imgpath = "img/mod/folder.png";
                        } else {
                            var extension = MM.util.getFileExtension(entry.filename);
                            if (typeof(MM.plugins.contents.templates.mimetypes[extension]) != "undefined") {
                                entry.imgpath = "img/files/" + MM.plugins.contents.templates.mimetypes[extension]["icon"] + "-64.png";
                            }
                        }

                        entry.link = encodeURIComponent(JSON.stringify(entry.link));
                        entry.filename = MM.util.formatText(entry.filename, true);

                        data.entries.push(entry);
                    });

                    html = MM.tpl.render(MM.plugins.myfiles.templates.files.html, data);
                    pageTitle = MM.plugins.myfiles.path.join(" / ");
                    MM.panels.show('center', html, {title: pageTitle});
                },
                null,
                function (error) {
                    MM.popErrorMessage(error);
                }
            );
        },

        templates: {
            "files": {
                html: filesTpl
            }
        }

    };

    MM.registerPlugin(plugin);

});