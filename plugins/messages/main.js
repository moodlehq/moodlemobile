var requires = [
    "root/externallib/text!root/plugins/messages/messages.html"
];


define(requires, function (messagesTpl) {

    var plugin = {
        settings: {
            name: "messages",
            type: "general",
            icon: "plugins/messages/icon.png",
            menuURL: "#messages",
            lang: {
                component: "core"
            }
        },

        routes: [
            ["messages", "messages", "showMessages"]
        ],

        templates: {
            "messages": {
                html: messagesTpl
            }
        },

        wsPrefix: "",

        /**
         * Determines is the plugin is visible.
         * It may check Moodle remote site version, device OS, device type, etc...
         * This function is called when a alink to a plugin functinality is going to be rendered.
         *
         * @return {bool} True if the plugin is visible for the site and device
         */
        isPluginVisible: function() {
            // The plugin is visible either if is available the remote service for pulling messages or
            // the platform support Push messages.

            var visible = false;

            if (MM.util.wsAvailable('local_mobile_core_message_get_messages')) {
                MM.plugins.messages.wsPrefix = "local_mobile_";
                visible = true;
            } else if (MM.util.wsAvailable('core_message_get_messages')) {
                visible = true;
            }

            return visible;
        },

        _renderMessages: function(messages) {
            tpl = {messages: messages};
            html = MM.tpl.render(MM.plugins.messages.templates.messages.html, tpl);
            MM.panels.show('center', html, {hideRight: true, title: MM.lang.s("messages")});
            $(".reply-button").on(MM.clickType, function(e) {
                e.preventDefault();
                var userId = $(this).data("useridfrom");
                if (MM.plugins.sendmessage) {
                    MM.plugins.sendmessage._displayMessageForm(userId);
                } else {
                    var url = MM.config.current_site.siteurl + "/message/index.php?user=" + MM.config.current_site.userid + "&id=" + userId;
                    window.open(url, "_system");
                }
            });
        },

         _format: function(text) {
            text = text.replace(/-{4,}/ig, '');
            text = MM.util.formatText(text, true);
            text = MM.util.createLinks(text).replace(/<br \/><br \/>/ig, "<br />");
            return text;
        },

        /**
         * Messages plugin main entry point for the user
         * It may display the button for enable messages or the list of messages received
         *
         */
        showMessages: function() {
            var html, tpl;

            MM.panels.showLoading('center');
            MM.panels.hide("right", "");
            MM.Router.navigate('');

            $('a[href="#messages"]').addClass('loading-row');

            MM.plugins.messages._renderMessageList();
        },

        _renderMessageList: function() {

            var limit = 50;

            var params = {
                useridto: MM.config.current_site.userid,
                useridfrom: 0,
                type: 'conversations',
                read: 0,
                newestfirst: 1,
                limitfrom: 0,
                limitnum: limit
            };

            MM.plugins.messages._getMessages(
                params,
                function(messages) {
                    if (messages.messages) {
                        if (messages.messages.length >= limit) {
                            MM.plugins.messages._renderMessages(messages);
                        } else {
                            params.limitnum = limit - messages.messages.length;
                            params.read = 1;
                            // Load more messages but now read messages.
                            MM.plugins.messages._getMessages(
                                params,
                                function(moremessages) {
                                    $('a[href="#messages"]').removeClass('loading-row');
                                    if (moremessages.messages) {
                                        MM.plugins.messages._renderMessages(
                                            messages.messages.concat(moremessages.messages));
                                    } else {
                                        MM.plugins.messages._renderMessages(messages.messages);
                                    }
                                },
                                function() {
                                    $('a[href="#messages"]').removeClass('loading-row');
                                    MM.plugins.messages._renderMessages([]);
                                }
                            );
                        }
                    } else {
                        $('a[href="#messages"]').removeClass('loading-row');
                        if (messages.exception && messages.errorcode == "disabled") {
                            MM.popErrorMessage(messages.message);
                        } else {
                            MM.plugins.messages._renderMessages([]);
                        }
                    }
                },
                function(e) {
                    $('a[href="#messages"]').removeClass('loading-row');
                    MM.popErrorMessage(e);
                }
            );
        },

        _getMessages: function(params, successCallback, errorCallback) {
            MM.moodleWSCall(
                MM.plugins.messages.wsPrefix + 'core_message_get_messages',
                params,
                function(messages) {
                    if (typeof successCallback == "function") {
                        successCallback(messages);
                    }
                },
                {
                    getFromCache: false,
                    saveToCache: true
                },
                function(e) {
                    if (typeof errorCallback == "function") {
                        errorCallback(e);
                    }
                }
            );
        },

        /**
         * Get contacts
         * @param  {object} successCallback Success callback function
         * @param  {object} errorCallback   Error callback function
         */
        _getContacts: function(successCallback, errorCallback) {

            MM.moodleWSCall(
                MM.plugins.messages.wsPrefix + 'get_contacts',
                {},
                function(contacts) {
                    if (typeof successCallback == "function") {
                        successCallback(contacts);
                    }
                },
                null,
                function(e) {
                    if (typeof errorCallback == "function") {
                        errorCallback(e);
                    }
                }
            );
        },

        /**
         * Create a contact
         * @param  {number} userId userId to be added as contact
         * @param  {object} successCallback Success callback function
         * @param  {object} errorCallback   Error callback function
         */
        _createContact: function(userId, successCallback, errorCallback) {
            var data = {
                "userids[0]" : userId
            };

            MM.moodleWSCall(
                MM.plugins.messages.wsPrefix + 'create_contacts',
                data,
                function(warnings) {
                    if (warnings && warnings.length) {
                        if (typeof errorCallback == "function") {
                            errorCallback(warnings[0]['message']);
                        }
                        return;
                    }
                    if (typeof successCallback == "function") {
                        successCallback(contacts);
                    }
                },
                null,
                function(e) {
                    if (typeof errorCallback == "function") {
                        errorCallback(e);
                    }
                }
            );
        },

        /**
         * Delete a contact
         * @param  {number} userId userId to be deleted as contact
         * @param  {object} successCallback Success callback function
         * @param  {object} errorCallback   Error callback function
         */
        _deleteContact: function(userId, successCallback, errorCallback) {
            var data = {
                "userids[0]" : userId
            };

            MM.moodleWSCall(
                MM.plugins.messages.wsPrefix + 'delete_contacts',
                data,
                function(result) {
                    if (typeof successCallback == "function") {
                        successCallback();
                    }
                },
                null,
                function(e) {
                    if (typeof errorCallback == "function") {
                        errorCallback(e);
                    }
                }
            );
        },

        /**
         * Block a contact
         * @param  {number} userId userId to be blocked
         * @param  {object} successCallback Success callback function
         * @param  {object} errorCallback   Error callback function
         */
        _blockContact: function(userId, successCallback, errorCallback) {
            var data = {
                "userids[0]" : userId
            };

            MM.moodleWSCall(
                MM.plugins.messages.wsPrefix + 'block_contacts',
                data,
                function(warnings) {
                    if (warnings && warnings.length) {
                        if (typeof errorCallback == "function") {
                            errorCallback(warnings[0]['message']);
                        }
                        return;
                    }
                    if (typeof successCallback == "function") {
                        successCallback(contacts);
                    }
                },
                null,
                function(e) {
                    if (typeof errorCallback == "function") {
                        errorCallback(e);
                    }
                }
            );
        },

        /**
         * Unblock a contact
         * @param  {number} userId userId to be unblocked
         * @param  {object} successCallback Success callback function
         * @param  {object} errorCallback   Error callback function
         */
        _unblockContact: function(userId, successCallback, errorCallback) {
            var data = {
                "userids[0]" : userId
            };

            MM.moodleWSCall(
                MM.plugins.messages.wsPrefix + 'unblock_contacts',
                data,
                function(result) {
                    if (typeof successCallback == "function") {
                        successCallback();
                    }
                },
                null,
                function(e) {
                    if (typeof errorCallback == "function") {
                        errorCallback(e);
                    }
                }
            );
        },

        /**
         * Search contacts
         * @param  {string} text search text
         * @param  {string} onlyMyCourses search only in my courses
         * @param  {object} successCallback Success callback function
         * @param  {object} errorCallback   Error callback function
         */
        _searchContacts: function(text, onlyMyCourses, successCallback, errorCallback) {
            var data = {
                "searchtext" : text,
                "onlymycourses": onlyMyCourses
            };

            MM.moodleWSCall(
                MM.plugins.messages.wsPrefix + 'search_contacts',
                data,
                function(contacts) {
                    if (typeof successCallback == "function") {
                        successCallback(contacts);
                    }
                },
                null,
                function(e) {
                    if (typeof errorCallback == "function") {
                        errorCallback(e);
                    }
                }
            );
        },
    };

    MM.registerPlugin(plugin);

    // After register the plugin, bind events.
    $(document).bind('resume', MM.plugins.messages.check);
});