var templates = [
    "root/externallib/text!root/plugins/forum/view.html",
    "root/externallib/text!root/plugins/forum/discussion.html",
    "root/externallib/text!root/plugins/forum/discussions.html",
    "root/externallib/text!root/plugins/forum/attachments.html"
];

define(templates, function (filesTpl, discussionTpl, discussionsTpl, attachmentsTpl) {
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
            "forum_files": {type: "collection", model: "forum_file"}
        },

        routes: [
            ["forum/view/:courseId/:cmid", "view_forum", "viewForum"],
        ],

        wsPrefix: "",

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
                            MM.util.wsAvailable('mod_forum_get_forum_discussions') &&
                            MM.util.wsAvailable('mod_forum_get_forum_discussion_posts');

            // Fallback to local_mobile plugin ones.
            if (!visible) {
                visible =   MM.util.wsAvailable('local_mobile_mod_forum_get_forums_by_courses') &&
                            MM.util.wsAvailable('local_mobile_mod_forum_get_forum_discussions') &&
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
            return MM.tpl.render(MM.plugins.forum.templates.view.html, data);
        },

        /**
         * Display a forum and discussions
         * @param  {Number} cmid The course module number id
         *
         */
        viewForum: function(courseId, cmid) {
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
                        MM.plugins.forum._showDiscussions(currentForum);
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
        _showDiscussions: function(forum) {

            var params = {
                "forumid": forum.id,        // Forum module instance id.
                "sortby":  "timemodified",
                "sortdirection":  "DESC",
                "page": 0,
                "perpage": 10
            };

            MM.moodleWSCall(MM.plugins.forum.wsPrefix + "mod_forum_get_forum_discussions",
                params,
                // Success callback.
                function(discussions) {
                    // Stops loading...
                    $("#info-" + forum.cmid, "#panel-right").attr("src", "img/info.png");

                    var pageTitle = MM.util.formatText(forum.name);
                    var data = {
                        "forum": forum,
                        "discussions": discussions.discussions
                    };

                    MM.plugins.forum.discussionsCache = discussions.discussions;

                    var html = MM.tpl.render(MM.plugins.forum.templates.discussions.html, data);
                    MM.panels.show("right", html, {title: pageTitle});

                    // Handlers for view complete discussions and posts.
                    $(".subject.toogler").on(MM.clickType, function(e) {
                        e.preventDefault();
                        if ($(this).hasClass("discussion-loaded")) {
                            $(this).parent().find(".discussion-body").toggle();
                            return;
                        }

                        var discussionId = $(this).data("discussionid");
                        $(this).addClass("discussion-loaded");
                        $(this).parent().find(".discussion-body").html('<div class="centered"><img src="img/loading.gif"></div>');
                        MM.plugins.forum._showDiscussion(discussionId);
                    });
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
        _showDiscussion: function(discussionId) {
            var params = {
                "discussionid": discussionId
            };

            var discussionSubject = $("#panel-right").find("[data-discussionid='" + discussionId + "']");

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

                    var data = {
                        "discussion": discussion,
                        "posts": posts.posts
                    };
                    var html = MM.tpl.render(MM.plugins.forum.templates.discussion.html, data);
                    discussionSubject.parent().find(".discussion-body").html(html);

                    // Toggler effect.
                    $(".forum-post .subject").on(MM.clickType, function(e) {
                        $(this).parent().find(".content").toggle();
                    });

                    // Bind downloads.
                    $(".forum-download").on(MM.clickType, function(e) {
                        e.preventDefault();
                        e.stopPropagation();

                        var url = $(this).data("downloadurl");
                        var filename = $(this).data("filename");
                        var attachmentId = $(this).data("attachmentid");

                        MM.plugins.forum._downloadFile(url, filename, attachmentId);
                    });
                    // Force attachments to open.
                    MM.handleFiles('#panel-right a[rel="external"]');

                },
                null,
                function (error) {
                    discussionSubject.parent().find(".discussion-body").html("");
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

            filename = decodeURIComponent(filename);
            filename = filename.replace(/\s/g, "_");

            // iOs doesn't like names not encoded.
            if (MM.deviceOS == 'ios') {
                filename = encodeURIComponent(filename);
            }

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
                                // Android, open in new browser
                                MM.handleFiles(linkCssId);
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
            }
        }

    };

    MM.registerPlugin(plugin);

});