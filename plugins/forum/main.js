var templates = [
    "root/externallib/text!root/plugins/forum/view.html",
    "root/externallib/text!root/plugins/forum/discussion.html",
    "root/externallib/text!root/plugins/forum/discussions.html",
    "root/externallib/text!root/plugins/forum/attachments.html",
    "root/externallib/text!root/plugins/forum/worker.js"
];

define(templates, function (filesTpl, discussionTpl, discussionsTpl, attachmentsTpl, workerCode) {
    var plugin = {
        settings: {
            name: "forum",
            type: "mod",
            component: "mod_forum",
            lang: {
                component: "core"
            }
        },

        storage: {
            "forum_file": {type: "model"},
            "forum_files": {type: "collection", model: "forum_file"},
            "forum_sync": {type: "model"},
            "forum_syncs": {type: "collection", model: "forum_sync"}
        },

        routes: [
            ["forum/view/:courseId/:cmid/:page", "view_forum", "viewForum"],
            ["forum/discussion/:courseId/:discussionId", "show_discussion", "showDiscussion"],
        ],

        // Sync function, every 2 hours (time is in millisecs).
        sync: {
            handler: function() {
                // We need to define here a function since MM.plugins.forum is not yet defined.
                MM.plugins.forum._syncForums();
            },
            time: 7200000
        },

        wsPrefix: "",

        sectionsCache: {},

         /**
         * Determines is the plugin is visible.
         * It may check Moodle remote site version, device OS, device type, etc...
         * This function is called when a alink to a plugin functinality is going to be rendered.
         *
         * @return {bool} True if the plugin is visible for the site and device
         */
        isPluginVisible: function() {
            // First check core services.
            var visible =   MM.util.wsAvailable('mod_forum_get_forums_by_courses') &&
                            MM.util.wsAvailable('mod_forum_get_forum_discussions_paginated') &&
                            MM.util.wsAvailable('mod_forum_get_forum_discussion_posts');

            // Fallback to local_mobile plugin ones.
            if (!visible) {
                visible =   MM.util.wsAvailable('local_mobile_mod_forum_get_forums_by_courses') &&
                            MM.util.wsAvailable('local_mobile_mod_forum_get_forum_discussions_paginated') &&
                            MM.util.wsAvailable('local_mobile_mod_forum_get_forum_discussion_posts');

                if (visible) {
                    MM.plugins.forum.wsPrefix = "local_mobile_";
                }
            }
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
            MM.plugins.forum.sectionsCache[module.contentid] = MM.util.formatText(section.name);

            return MM.tpl.render(MM.plugins.forum.templates.view.html, data);
        },

        perPage: 20,

        /**
         * Display a forum and discussions
         * @param  {Number} cmid The course module number id
         *
         */
        viewForum: function(courseId, cmid, page) {
            // Loading ....
            $("#info-" + cmid, "#panel-right").attr("src", "img/loadingblack.gif");

            // First, load the complete information of forums in this course.
            var params = {
                "courseids[0]": courseId
            };

            MM.moodleWSCall(MM.plugins.forum.wsPrefix + "mod_forum_get_forums_by_courses",
                params,
                function(forums) {
                    var currentForum;
                    _.each(forums, function(forum) {
                        if (forum.cmid == cmid) {
                            currentForum = forum;
                        }
                    });
                    if (currentForum) {
                        MM.plugins.forum._showDiscussions(currentForum, page);
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
         * Display discussions of a forum
         * @param  {Object} forum Forum object
         *
         */
        _showDiscussions: function(forum, page) {

            var params = {
                "forumid": forum.id,        // Forum module instance id.
                "sortby":  "timemodified",
                "sortdirection":  "DESC",
                "page": page,
                "perpage": MM.plugins.forum.perPage
            };

            MM.moodleWSCall(MM.plugins.forum.wsPrefix + "mod_forum_get_forum_discussions_paginated",
                params,
                // Success callback.
                function(discussions) {
                    // Stops loading...
                    $("#info-" + forum.cmid, "#panel-right").attr("src", "img/info.png");
                    var siteId = MM.config.current_site.id;

                    var syncStatus = "";
                    if (MM.db.get('forum_syncs', siteId + "-" + forum.cmid)) {
                        syncStatus = 'checked="checked"';
                    }

                    var sectionName = "";
                    if (MM.plugins.forum.sectionsCache[forum.cmid]) {
                        sectionName = MM.plugins.forum.sectionsCache[forum.cmid];
                    }

                    var pageTitle = '<div id="back-arrow-title" class="media">\
                            <div class="img app-ico">\
                                <img src="img/mod/forum.png" alt="img">\
                            </div>\
                            <div class="bd">\
                                <h2>' + MM.util.formatText(forum.name) + '</h2>\
                            </div>\
                        </div>';

                    // var pageTitle = MM.util.formatText(forum.name);
                    var data = {
                        "page": page,
                        "perpage": MM.plugins.forum.perPage,
                        "forum": forum,
                        "discussions": discussions.discussions,
                        "syncStatus": syncStatus,
                        "sectionName": sectionName
                    };

                    MM.plugins.forum.discussionsCache = discussions.discussions;

                    var html = MM.tpl.render(MM.plugins.forum.templates.discussions.html, data);
                    MM.panels.show("right", html, {title: pageTitle});

                    // Handler for sync.
                    if (MM.util.WebWorkersSupported()) {
                        $("#keepsynch").bind("change", function(e) {
                            var uniqueId = siteId + "-" + $(this).data("cmid");

                            if ($(this).prop("checked")) {
                                var el = {
                                    id: uniqueId,
                                    forumid: $(this).data("forumid"),
                                    cmid: $(this).data("cmid"),
                                    site: siteId
                                };
                                MM.db.insert("forum_syncs", el);
                            } else {
                                MM.db.remove("forum_syncs", uniqueId);
                            }
                        });
                    }

                    // Detect if the device supports WebWorkers.
                    if (MM.util.WebWorkersSupported()) {

                        // Create dinamically a Worker script. Workers from file:// are not supported.
                        var blobURL = new Blob([MM.plugins.forum.templates.worker.js]);

                        var worker = new Worker(window.URL.createObjectURL(blobURL));
                        worker.onmessage = function(e) {
                            // Cache the results of the XHR call.
                            if (e.data && e.data.xhrData && e.data.data) {
                                MM.cache.addWSCall(e.data.url, e.data.xhrData, e.data.data);
                            }
                        };

                        var forums = [forum.id];
                        var info = {
                            siteurl: MM.config.current_site.siteurl,
                            token: MM.config.current_token,
                            forums: forums,
                            wsPrefix: MM.plugins.forum.wsPrefix,
                            page: page,
                            perPage: MM.plugins.forum.perPage
                        };

                        MM.log("Starting sync download of discussions and forums via Web Workers", "Forum");
                        worker.postMessage(info);
                        window.URL.revokeObjectURL(blobURL);

                    } else {
                        // Sync download of discussions and posts.
                        MM.plugins.forum.downloadQueue = [];

                        // Download all the discussions posts.
                        for (var el in MM.plugins.forum.discussionsCache) {
                            var d = MM.plugins.forum.discussionsCache[el];
                            MM.plugins.forum.downloadQueue.push(d.discussion);
                        }
                        MM.plugins.forum._processDiscussionsQueue();
                    }
                },
                null,
                function (error) {
                    $("#info-" + forum.cmid, "#panel-right").attr("src", "img/info.png");
                    MM.popErrorMessage(error);
                }
            );
        },

        /**
         * Display a discussion with posts
         * @param  {Number} discussionId The discussion id
         */
        showDiscussion: function(courseId, discussionId) {
            var params = {
                "discussionid": discussionId
            };

            MM.moodleWSCall(MM.plugins.forum.wsPrefix + "mod_forum_get_forum_discussion_posts",
                params,
                // Success callback.
                function(posts) {
                    var discussion;

                    // Cache for getting the discussion.
                    for (var el in MM.plugins.forum.discussionsCache) {
                        var d = MM.plugins.forum.discussionsCache[el];
                        if (d.discussion == discussionId) {
                            discussion = d;
                            break;
                        }
                    }

                    // Not found, search in the returned posts.
                    if (!discussion) {
                        for (el in posts.posts) {
                            var post = posts.posts[el];
                            if (post.parent == 0) {
                                discussion = post;
                                break;
                            }
                        }
                    }

                    var data = {
                        "discussion": discussion,
                        "posts": posts.posts,
                        "courseId": courseId
                    };
                    var html = MM.tpl.render(MM.plugins.forum.templates.discussion.html, data);
                    MM.panels.show("right", html, {keepTitle: true, showRight: true});

                    // Hack in tablet view.
                    if (MM.deviceType == "tablet") {
                        var panelCenter = $('#panel-center');
                        var panelRight  = $('#panel-right');

                        panelCenter.css("width", MM.panels.sizes.threePanels.center);
                        panelRight.css("left",  MM.panels.sizes.threePanels.center);
                        panelRight.css("width", MM.panels.sizes.threePanels.right);
                    }

                    // Toggler effect.
                    $(".forum-post .subject", "#panel-right").on(MM.clickType, function(e) {
                        $(this).parent().find(".content").first().toggle();
                    });

                    // Bind downloads.
                    $(".forum-download", "#panel-right").on(MM.clickType, function(e) {
                        e.preventDefault();
                        e.stopPropagation();

                        var url = $(this).data("downloadurl");
                        var filename = $(this).data("filename");
                        var attachmentId = $(this).data("attachmentid");

                        MM.plugins.forum._downloadFile(url, filename, attachmentId);
                    });
                },
                null,
                function (error) {
                    MM.popErrorMessage(error);
                }
            );
        },

        _printAttachments: function(post) {
            if (!post.attachment || !post.attachments) {
                return '';
            }
            if (!post.attachments.length) {
                return '';
            }

            for (var el in post.attachments) {
                var attachment = post.attachments[el];

                post.attachments[el].id = post.id + "-" + el;

                var uniqueId = MM.config.current_site.id + "-" + hex_md5(attachment.fileurl);
                var path = MM.db.get("forum_files", uniqueId);
                if (path) {
                    post.attachments[el].localpath = path.get("localpath");
                }

                var extension = MM.util.getFileExtension(attachment.filename);
                if (typeof(MM.plugins.contents.templates.mimetypes[extension]) != "undefined") {
                    post.attachments[el].icon = MM.plugins.contents.templates.mimetypes[extension]["icon"] + "-64.png";
                }
            }

            var data = {"attachments": post.attachments};
            return MM.tpl.render(MM.plugins.forum.templates.attachments.html, data);
        },

        _downloadFile: function(url, filename, attachmentId) {
            // Add the token.
            var downloadURL = MM.fixPluginfile(url);
            var siteId = MM.config.current_site.id;
            var downCssId = $("#downimg-" + attachmentId);
            var linkCssId = $("#attachment-" + attachmentId);

            filename = MM.fs.normalizeFileName(filename);

            var directory = siteId + "/forum-files/" + attachmentId;
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
                                MM.db.insert("forum_files", file);

                                $(downCssId).remove();
                                $(linkCssId).attr("href", fullpath);
                                $(linkCssId).attr("rel", "external");
                                // Remove class and events.
                                $(linkCssId).removeClass("forum-download");
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

        _processDiscussionsQueue: function() {
            var preSets = {
                silently: true,
                getFromCache: false,
                saveToCache: true
            };

            if (MM.plugins.forum.downloadQueue.length < 1) {
                return;
            }

            var discussionId = MM.plugins.forum.downloadQueue.pop();
            var params = {
                "discussionid": discussionId
            };

            MM.moodleWSCall(MM.plugins.forum.wsPrefix + "mod_forum_get_forum_discussion_posts",
                params,
                // Success callback.
                function() {
                    MM.plugins.forum._processDiscussionsQueue();
                },
                preSets,
                function() {
                    MM.plugins.forum._processDiscussionsQueue();
                }
            );

        },

        /**
         * Periodically synchronize discussions and posts for the current active site.
         *
         */
        _syncForums: function() {
            // Sync only if the device is connected and supports workers.
            if(MM.deviceConnected() && MM.util.WebWorkersSupported()) {
                var siteId = MM.config.current_site.id;
                var forums = [];

                MM.db.each('forum_syncs', function(f) {
                    if (siteId == f.get('site')) {
                        forums.push(f.get("forumid"));
                    }
                });

                if (!forums.length) {
                    return;
                }

                // Create dinamically a Worker script. Workers from file:// are not supported.
                var blobURL = new Blob([MM.plugins.forum.templates.worker.js]);

                var worker = new Worker(window.URL.createObjectURL(blobURL));
                worker.onmessage = function(e) {
                    // Cache the results of the XHR call.
                    if (e.data && e.data.xhrData && e.data.data) {
                        MM.cache.addWSCall(e.data.url, e.data.xhrData, e.data.data);
                    }
                };
                var data = {
                    siteurl: MM.config.current_site.siteurl,
                    token: MM.config.current_token,
                    forums: forums,
                    wsPrefix: MM.plugins.forum.wsPrefix,
                    page: "0",
                    perPage: MM.plugins.forum.perPage
                };

                MM.log("Starting sync download of discussions and forums via Web Workers", "Forum");
                worker.postMessage(data);
                window.URL.revokeObjectURL(blobURL);
            }
        },

        templates: {
            "view": {
                html: filesTpl
            },
            "discussion": {
                html: discussionTpl
            },
            "discussions": {
                html: discussionsTpl
            },
            "attachments": {
                html: attachmentsTpl
            },
            "worker": {
                js: workerCode
            }
        }

    };

    MM.registerPlugin(plugin);

});