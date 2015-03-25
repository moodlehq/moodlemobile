var templates = [
    "root/externallib/text!root/plugins/assign/view.html",
    "root/externallib/text!root/plugins/assign/submissions.html"
];

define(templates, function (assignTpl, submissionsTpl) {
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

        submissionsCache: null,

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
                    if (currentAssign) {
                        MM.plugins.assign._showSubmissions(currentAssign);
                    }
                },
                null,
                function (error) {
                    $("#info-" + cmid, "#panel-right").attr("src", "img/info.png");
                    MM.popErrorMessage(error);
                }
            );
        },

        /**
         * Display submissions of a assign
         * @param  {Object} assign assign object
         *
         */
        _showSubmissions: function(assign) {

            var params = {
                "assignmentids[0]": assign.id
            };

            MM.moodleWSCall("mod_assign_get_submissions",
                params,
                // Success callback.
                function(result) {
                    // Stops loading...
                    $("#info-" + assign.cmid, "#panel-right").attr("src", "img/info.png");
                    var siteId = MM.config.current_site.id;

                    var sectionName = "";
                    if (MM.plugins.assign.sectionsCache[assign.cmid]) {
                        sectionName = MM.plugins.assign.sectionsCache[assign.cmid];
                    }

                    var pageTitle = '<div id="back-arrow-title" class="media">\
                            <div class="img app-ico">\
                                <img src="img/mod/assign.png" alt="img">\
                            </div>\
                            <div class="bd">\
                                <h2>' + MM.util.formatText(assign.name) + '</h2>\
                            </div>\
                        </div>';


                    var data = {
                        "assign": assign,
                        "sectionName": sectionName,
                        "activityLink": MM.config.current_site.siteurl + '/mod/assign/view.php?id=' + assign.cmid,
                        "submissions": [],
                        "users": {}
                    };

                    // Check if we can view submissions, with enought permissions.
                    if (result.warnings.length > 0 && result.warnings[0].warningcode == 1) {
                        data.canviewsubmissions = false;
                    } else {
                        data.canviewsubmissions = true;
                        data.submissions = result.assignments[0].submissions;
                    }

                    // Handle attachments.
                    for (var el in assign.introattachments) {
                        var attachment = assign.introattachments[el];

                        assign.introattachments[el].id = assign.id + "-intro-" + el;

                        var uniqueId = MM.config.current_site.id + "-" + hex_md5(attachment.fileurl);
                        var path = MM.db.get("assign_files", uniqueId);
                        if (path) {
                            assign.introattachments[el].localpath = path.get("localpath");
                        }

                        var extension = MM.util.getFileExtension(attachment.filename);
                        if (typeof(MM.plugins.contents.templates.mimetypes[extension]) != "undefined") {
                            assign.introattachments[el].icon = MM.plugins.contents.templates.mimetypes[extension]["icon"] + "-64.png";
                        }
                    }

                    // Render the page if the user is likely an student.
                    if (! data.canviewsubmissions) {
                        MM.plugins.assign._renderSubmissionsPage(data, pageTitle);
                    } else {
                        // In this case, we would need additional information (like pre-fetching the course participants).
                        MM.plugins.participants._loadParticipants(assign.course, 0, 0,
                            function(users) {

                                // Recover the users who has made submissions, we need to retrieve the full information later.
                                var userIds = [];
                                data.submissions.forEach(function(sub) {
                                    userIds.push(sub.userid);
                                });

                                // Save the users in the users table. We are going to need the user names.
                                var newUser;
                                users.forEach(function(user) {
                                    newUser = {
                                        'id': MM.config.current_site.id + '-' + user.id,
                                        'userid': user.id,
                                        'fullname': user.fullname,
                                        'profileimageurl': user.profileimageurl
                                    };
                                    MM.db.insert('users', newUser);
                                    if (userIds.indexOf(user.id) > -1) {
                                        data.users[user.id] = newUser;
                                    }
                                });
                                // Render the submissions page.
                                MM.plugins.assign._renderSubmissionsPage(data, pageTitle);
                            },
                            function(m) {
                                $("#info-" + assign.cmid, "#panel-right").attr("src", "img/info.png");
                                MM.popErrorMessage(error);
                            }
                        );
                    }
                },
                null,
                function (error) {
                    $("#info-" + assign.cmid, "#panel-right").attr("src", "img/info.png");
                    MM.popErrorMessage(error);
                }
            );
        },

        _renderSubmissionsPage: function(data, pageTitle) {

            MM.plugins.assign.submissionsCache = data.submissions;

            var html = MM.tpl.render(MM.plugins.assign.templates.submissions.html, data);
            MM.panels.show("right", html, {title: pageTitle});

            // Handle intro files downloads.
            $(".assign-download", "#panel-right").on(MM.clickType, function(e) {
                e.preventDefault();
                e.stopPropagation();

                var url = $(this).data("downloadurl");
                var filename = $(this).data("filename");
                var attachmentId = $(this).data("attachmentid");

                MM.plugins.assign._downloadFile(url, filename, attachmentId);
            });

            // View submission texts.
            $(".submissiontext", "#panel-right").on(MM.clickType, function(e) {
                e.preventDefault();
                e.stopPropagation();

                var submissionid = $(this).data("submissionid");
                var submission = {};
                data.submissions.forEach(function(s) {
                    if (s.id == submissionid) {
                        submission = s;
                    }
                })
                var text = MM.plugins.assign._getSubmissionText(submission);
                MM.widgets.renderIframeModalContents(pageTitle, text);

            });
        },

        _getSubmissionText: function(submission) {
            var text = '';
            if (submission.plugins) {
                submission.plugins.forEach(function(plugin) {
                    if (plugin.type == 'onlinetext' && plugin.editorfields) {
                        text = plugin.editorfields[0].text;

                        if (plugin.fileareas && plugin.fileareas[0] && plugin.fileareas[0].files && plugin.fileareas[0].files[0]) {
                            var fileURL =  plugin.fileareas[0].files[0].fileurl;
                            fileURL = fileURL.substr(0, fileURL.lastIndexOf('/')).replace('pluginfile.php/', 'pluginfile.php?token='+MM.config.current_token+'&file=/');
                            text = text.replace(/@@PLUGINFILE@@/g, fileURL);
                        }
                    }
                });
            }
            return text;
        },

        _getSubmissionFiles: function(submission) {
            var files = [];
            if (submission.plugins) {
                submission.plugins.forEach(function(plugin) {
                    if (plugin.type == 'file' && plugin.fileareas && plugin.fileareas[0] && plugin.fileareas[0].files) {
                        files = plugin.fileareas[0].files;
                    }
                });
            }
            // Find local path of files.
            if (files.length > 0) {
                    for (var el in files) {
                    var file = files[el];

                    files[el].id = submission.id + el;

                    var uniqueId = MM.config.current_site.id + "-" + hex_md5(file.fileurl);
                    var path = MM.db.get("assign_files", uniqueId);
                    if (path) {
                        files[el].localpath = path.get("localpath");
                    }

                    var extension = MM.util.getFileExtension(file.filepath);
                    if (typeof(MM.plugins.contents.templates.mimetypes[extension]) != "undefined") {
                        files[el].icon = MM.plugins.contents.templates.mimetypes[extension]["icon"] + "-64.png";
                    }
                }
            }
            return files;
        },

        _downloadFile: function(url, filename, attachmentId) {
            // Add the token.
            var downloadURL = MM.fixPluginfile(url);
            var siteId = MM.config.current_site.id;
            var downCssId = $("#downimg-" + attachmentId);
            var linkCssId = $("#attachment-" + attachmentId);

            filename = MM.fs.normalizeFileName(filename);

            var directory = siteId + "/assign-files/" + attachmentId;
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
                                MM.db.insert("assign_files", file);

                                $(downCssId).remove();
                                $(linkCssId).attr("href", fullpath);
                                $(linkCssId).attr("rel", "external");
                                // Remove class and events.
                                $(linkCssId).removeClass("assign-download");
                                $(linkCssId).off(MM.clickType);

                                // Android, open in new browser
                                MM.handleFiles(linkCssId);
                                MM._openFile(fullpath);

                            },
                            function(fullpath) {
                                $(downCssId).remove();
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
            "view": {
                html: assignTpl
            },
            "submissions": {
                html: submissionsTpl
            }
        }

    };

    MM.registerPlugin(plugin);

});