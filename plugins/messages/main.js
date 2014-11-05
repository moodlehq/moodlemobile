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

            MM.moodleWSCall(
                MM.plugins.messages.wsPrefix + 'core_message_get_messages',
                params,
                function(messages) {
                    if (messages.messages) {
                        if (messages.messages.length >= limit) {
                            MM.plugins.messages._renderMessages(messages);
                        } else {
                            params.limitnum = limit - messages.messages.length;
                            params.read = 1;
                            MM.moodleWSCall(
                                MM.plugins.messages.wsPrefix + 'core_message_get_messages',
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
                                {
                                    getFromCache: false,
                                    saveToCache: true
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
                {
                    getFromCache: false,
                    saveToCache: true
                },
                function(e) {
                    $('a[href="#messages"]').removeClass('loading-row');
                    MM.popErrorMessage(e);
                }
            );
        }
    };

    MM.registerPlugin(plugin);

    // After register the plugin, bind events.
    $(document).bind('resume', MM.plugins.messages.check);
});