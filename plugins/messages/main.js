var requires = [
    "root/externallib/text!root/plugins/messages/messages.html",
    "root/externallib/text!root/plugins/messages/recent.html",
    "root/externallib/text!root/plugins/messages/conversation.html",
    "root/externallib/text!root/plugins/messages/contact.html",
    "root/externallib/text!root/plugins/messages/contacts.html"
];


define(requires, function (messagesTpl, recentTpl, conversationTpl, contactTpl, contactsTpl) {

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
            ["messages", "messages", "showMessages"],
            ["messages/conversation/:userId", "messages_conversation", "showConversation"],
            ["messages/contacts", "messages_contacts", "showContacts"],
            ["messages/contact/:userId", "messages_contact", "showContact"]
        ],

        templates: {
            "messages": {
                html: messagesTpl
            },
            "recent": {
                html: recentTpl
            },
            "conversation": {
                html: conversationTpl
            },
            "contact": {
                html: contactTpl
            },
            "contacts": {
                html: contactsTpl
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

            setTimeout(function() {
                MM.plugins.messages._showRecentConversations();
            }, 600);
            return;

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
        },

        _showRecentConversations: function() {
            $('a[href="#messages"]').removeClass('loading-row');
            html = MM.tpl.render(MM.plugins.messages.templates.recent.html, {});
            MM.panels.show('center', html, {title: MM.lang.s("messages")});

            $("#header-action-contacts").css("position", "fixed");
            $("#header-action-contacts").css("z-index", "9999");
            $("#header-action-contacts").css("top", "2px");
            $("#header-action-contacts").css("right", "4px");
            $("#header-action-contacts").html('<a href="#messages/contacts"><img src="img/ico-contacts.png"></a>');
        },

        showContacts: function() {
            html = MM.tpl.render(MM.plugins.messages.templates.contacts.html, {});
            MM.panels.show('center', html, {title: MM.lang.s("contacts")});

            $("#header-action-recent").css("position", "fixed");
            $("#header-action-recent").css("z-index", "9999");
            $("#header-action-recent").css("top", "2px");
            $("#header-action-recent").css("right", "4px");
            $("#header-action-recent").html('<a href="#messages"><img src="plugins/messages/icon.png"></a>');
        },

        showContact: function(userId) {
            html = MM.tpl.render(MM.plugins.messages.templates.contact.html, {});
            MM.panels.show('right', html, {title: MM.lang.s("info")});
        },

        showConversation: function(userId) {
            html = MM.tpl.render(MM.plugins.messages.templates.conversation.html, {});
            MM.panels.show('right', html, {title: "John Smith"});

            $("#header-action-contact").css("position", "fixed");
            $("#header-action-contact").css("z-index", "9999");
            $("#header-action-contact").css("top", "2px");
            $("#header-action-contact").css("right", "4px");
            $("#header-action-contact").html('<a href="#messages/contact/1"><img src="img/userimage.png"></a>');
        }
    };

    MM.registerPlugin(plugin);

    // After register the plugin, bind events.
    $(document).bind('resume', MM.plugins.messages.check);
});