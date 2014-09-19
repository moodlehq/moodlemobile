var templates = [
    "root/externallib/text!root/plugins/forum/view.html",
    "root/externallib/text!root/plugins/forum/discussion.html",
    "root/externallib/text!root/plugins/forum/discussions.html"
];

define(templates, function (filesTpl, discussionTpl, discussionsTpl) {
    var plugin = {
        settings: {
            name: "forum",
            type: "mod",
            component: "mod_forum",
            lang: {
                component: "core"
            }
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
                    MM.popErrorMessage(error);
                }
            );

            //MM.panels.show('right', html, {title: pageTitle});
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
                    var pageTitle = MM.util.formatText(forum.name);
                    var data = {
                        "forum": forum,
                        "discussions": discussions.discussions
                    };

                    var html = MM.tpl.render(MM.plugins.forum.templates.discussions.html, data);
                    MM.panels.show("right", html, {title: pageTitle});
                },
                null,
                function (error) {
                    MM.popErrorMessage(error);
                }
            );
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
            }
        }

    };

    MM.registerPlugin(plugin);

});