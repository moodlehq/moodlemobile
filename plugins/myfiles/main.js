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

        storage: {
            file: {type: "model"},
            files: {type: "collection", model: "file"}
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
            var html;
            var pageTitle = MM.lang.s("myfiles");

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
                fullPath: "",
                dir: dir,
                entries: []
            };

            if (dir == "root") {
                data.goBack = false;
                var entry = {
                    isdir: 1,
                    link: "private",
                    linkId: hex_md5("private"),
                    imgpath: "img/mod/folder.png",
                    filename: MM.lang.s("privatefiles"),
                };
                data.entries.push(entry);

                entry = {
                    isdir: 1,
                    link: "site",
                    linkId: hex_md5("site"),
                    imgpath: "img/mod/folder.png",
                    filename: MM.lang.s("sitefiles"),
                };
                data.entries.push(entry);

                html = MM.tpl.render(MM.plugins.myfiles.templates.files.html, data);
                MM.panels.show('center', html, {title: pageTitle, hideRight: true});
                return;

            } else if (dir == "private") {

                params.component = "user";
                params.filearea = "private";
                params.contextid = -1;
                params.contextlevel = "user";
                params.instanceid = MM.config.current_site.userid;

            } else if (dir == "site") {
                data.fullPath = MM.lang.s("system");

            } else {
                try {
                    params = JSON.parse(dir);
                } catch(e) {
                    MM.popErrorMessage(MM.lang.s("errorlistingfiles"));
                    return;
                }
            }

            var link = hex_md5(encodeURIComponent(dir));
            $('#' + link, '#panel-center').addClass('loading-row-black');

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
                        entry.linkId = hex_md5(entry.link);
                        entry.filename = MM.util.formatText(entry.filename, true);
                        entry.localpath = "";

                        if (!entry.isdir && entry.url) {
                            var uniqueId = MM.config.current_site.id + "-" + hex_md5(entry.url);
                            var path = MM.db.get("files", uniqueId);
                            if (path) {
                                entry.localpath = path.get("localpath");
                            }
                        }

                        data.entries.push(entry);
                    });

                    var parents = [];
                    _.each(result.parents, function(parent) {
                        parents.push(parent.filename);
                    });
                    // Push the current requested directory.
                    parents.push(params.filename ? params.filename : params.path);

                    if (dir == "site") {
                        data.fullPath = MM.lang.s("system");
                    }
                    else if (parents.length > 0) {
                        data.fullPath = parents.join(" / ");
                    }

                    html = MM.tpl.render(MM.plugins.myfiles.templates.files.html, data);
                    MM.panels.show('center', html, {title: pageTitle, hideRight: true});

                    // Bind downloads.
                    $(".myfiles-download").on(MM.clickType, function(e) {
                        e.preventDefault();
                        e.stopPropagation();

                        var url = $(this).data("url");
                        var filename = $(this).data("filename");
                        var linkId = $(this).data("linkid");

                        MM.plugins.myfiles._downloadFile(url, filename, linkId);
                    });
                },
                null,
                function (error) {
                    MM.popErrorMessage(error);
                }
            );
        },

        _downloadFile: function(url, filename, linkId) {
            // Add the token.
            var downloadURL = MM.fixPluginfile(url);
            var siteId = MM.config.current_site.id;
            var linkCssId = "#" + linkId;
            var downCssId = "#img-" + linkId;

            filename = decodeURIComponent(filename);
            filename = filename.replace(" ", "_");

            var directory = siteId + "/files/" + linkId;
            var filePath = directory + "/" + filename;

            MM.fs.init(function() {
                if (MM.deviceConnected()) {
                    MM.log("Starting download of Moodle file: " + downloadURL);
                    // All the functions are asynchronous, like createDir.
                    MM.fs.createDir(directory, function() {
                        MM.log("Downloading Moodle file to " + filePath + " from URL: " + downloadURL);

                        $(downCssId).attr("src", "img/loadingblack.gif");
                        MM.moodleDownloadFile(downloadURL, filePath,
                            function(fullpath) {
                                MM.log("Download of content finished " + fullpath + " URL: " + downloadURL);

                                var uniqueId = siteId + "-" + hex_md5(url);
                                var file = {
                                    id: uniqueId,
                                    url: url,
                                    site: siteId,
                                    localpath: fullpath
                                };
                                MM.db.insert("files", file);

                                $(downCssId).remove();
                                $(linkCssId).attr("href", fullpath);
                                $(linkCssId).attr("rel", "external");
                                // Android, open in new browser
                                MM.handleFiles(linkCssId);
                            },
                            function(fullpath) {
                               MM.log("Error downloading " + fullpath + " URL: " + downloadURL);
                            }
                        );
                    });
                } else {
                    MM.popErrorMessage(MM.lang.s("errornoconnectednocache"));
                }
            });
        },

        templates: {
            "files": {
                html: filesTpl
            }
        }

    };

    MM.registerPlugin(plugin);

});