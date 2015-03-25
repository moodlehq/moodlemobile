var requires = [
    "root/externallib/text!root/plugins/messages/messages.html",
    "root/externallib/text!root/plugins/messages/recent.html",
    "root/externallib/text!root/plugins/messages/conversation.html",
    "root/externallib/text!root/plugins/messages/contact.html",
    "root/externallib/text!root/plugins/messages/contacts.html",
    "root/externallib/text!root/plugins/messages/search.html",
    "root/externallib/text!root/plugins/messages/bubbles.html"
];


define(requires, function (messagesTpl, recentTpl, conversationTpl, contactTpl, contactsTpl, searchTpl, bubblesTpl) {

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
            },
            "search": {
                html: searchTpl
            },
            "bubbles": {
                html: bubblesTpl
            }
        },

        wsPrefix: "",

        recentContactMessages: [],

        recentContactsIds: {},

        blockedUsersIds: {},

        pollingInterval: 5000,

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

        /**
         * Messages plugin main entry point for the user
         * It may display the button for enable messages or the list of messages received
         *
         */
        showMessages: function() {
            var html, tpl;

            $('a[href="#messages"]').addClass('loading-row');

            // Checks if all the messaging WS are available.
            if (MM.util.wsAvailable('core_message_get_contacts') ||
                    MM.util.wsAvailable(MM.plugins.messages.wsPrefix + 'core_message_get_contacts')) {
                MM.panels.showLoading('center');
                MM.panels.showLoading('right');
                MM.plugins.messages._renderRecentMessages();
            } else {
                MM.panels.showLoading('center');
                MM.panels.hide("right", "");
                MM.Router.navigate('');
                MM.plugins.messages._renderMessageList();
            }
        },

        showConversation: function(userId) {

            var userName = "";
            var userPicture = "img/userimage.png";
            var user = MM.db.get('users', MM.config.current_site.id + "-" + userId);
            if (user) {
                userName = user.get("fullname");
                if (user.get("profileimageurl")) {
                    userPicture = user.get("profileimageurl");
                }
            }

            var data = {
                userName: userName
            };

            MM.panels.show('right', "", {title: userName});
            MM.panels.showLoading('right');

            var params = {
                useridto: MM.config.current_site.userid,
                useridfrom: userId,
                type: 'conversations',
                read: 0,
                newestfirst: 1,
                limitfrom: 0,
                limitnum: 50
            };

            // First, messages received.
            MM.plugins.messages._getRecentMessages(
                params,
                function(messagesReceived) {
                    // Now, messages sent.
                    params.useridto = userId;
                    params.useridfrom = MM.config.current_site.userid;

                    MM.plugins.messages._getRecentMessages(
                        params,
                        function(messagesSent) {
                            MM.plugins.messages._renderConversation(userId, userName, userPicture, messagesReceived, messagesSent);
                        },
                        function(e) {
                            MM.popErrorMessage(e);
                        }
                    );
                },
                function(e) {
                    MM.popErrorMessage(e);
                }
            );
        },

        _renderConversation: function(userId, userName, userPicture, messagesReceived, messagesSent) {

            // Join the arrays and sort.
            var messages = messagesReceived.concat(messagesSent);
            // Sort by timecreated.
            messages = messages.sort(function (a, b) {
                a = parseInt(a.timecreated, 10);
                b = parseInt(b.timecreated, 10);

                return a - b;
            });

            var data = {
                messages: messages,
                otherUser: userId,
                userName: userName,
                userPicture: userPicture
            };

            html = MM.tpl.render(MM.plugins.messages.templates.conversation.html, data);
            MM.panels.show('right', html, {title: userName});

            $('#message-send-form').on('submit', function(e) {
                e.preventDefault();
                var originalMessage = $(this).find("#message-text").val();

                $("#message-text").val("");
                conversationArea = $(".conversation-area");
                messageId = hex_md5(message + MM.util.timestamp());

                var message = '<div id="' + messageId + '" class="bubble bubble-alt">' + MM.util.formatText(originalMessage, true);
                message += '<span class="time"><span class="app-ico tick-gray"><img width="10" src="img/sent.png"></span></span></div>';
                conversationArea.append(message);
                // Scroll bottom.
                conversationArea.scrollTop(conversationArea.prop("scrollHeight"));

                MM.plugins.messages._sendMessage(userId, originalMessage,
                    function(m) {
                        $("#" + messageId).addClass("removeMessage");
                        $("#message-text").val("");
                    },
                    function(e) {
                        $("#" + messageId).find("img").attr("src", "img/error.png");
                    }
                );
            });

            setTimeout(function() {
                MM.plugins.messages._pollingMessages(userId);
            }, MM.plugins.messages.pollingInterval);

            // Conversation area height.
            var headerHeight = $('.header-wrapper').height();
            var inputArea = $(".path-messages .conversation .input-area");
            var inputHeight  = inputArea.height();
            var conversationArea = $('.path-messages .conversation .conversation-area');

            // Uggly hack.
            var fixFactor = 115;
            if (MM.deviceType == "tablet") {
                fixFactor = 60;
            } else if (MM.deviceOS == "ios") {
                fixFactor = 60;
            }

            // Height of the conversation area.
            conversationArea.css('height', $(document).innerHeight() - headerHeight - inputHeight - fixFactor);
            conversationArea.css('width', $("#panel-right").width());
            // Scroll bottom.
            conversationArea.scrollTop(conversationArea.prop("scrollHeight"));
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
         * Render the recent messages page.
         * Displays a list of contacts with last message (whatsapp/telegram style).
         */
        _renderRecentMessages: function() {

            MM.plugins.messages.recentContactMessages = [];
            MM.plugins.messages.recentContactsIds = {};

            var params = {
                useridto: MM.config.current_site.userid,
                useridfrom: 0,
                type: 'conversations',
                read: 0,
                newestfirst: 1,
                limitfrom: 0,
                limitnum: 50
            };

            // Get recent messages received (and sender).
            MM.plugins.messages._getRecentMessages(
                params,
                function(messages) {
                    // Find different senders in the messages list, in the latest 50 messages.
                    if (messages.length > 0) {
                        messages.forEach(function(m) {
                            if (!(m.useridfrom in MM.plugins.messages.recentContactsIds)) {
                                MM.plugins.messages.recentContactsIds[m.useridfrom] = {
                                    fullname: m.userfromfullname,
                                    profileimageurl: ""
                                };
                                if (!m.timeread) {
                                    MM.plugins.messages.recentContactsIds[m.useridfrom]["unread"] = 1;
                                }
                                MM.plugins.messages.recentContactMessages.push({
                                    user: m.useridfrom,
                                    message: m.smallmessage,
                                    timecreated: m.timecreated,
                                });
                            }
                        });
                    }

                    // Now get my latest messages send. Maybe I didn't receive a response.
                    params.useridfrom = MM.config.current_site.userid;
                    params.useridto = 0;

                    MM.plugins.messages._getRecentMessages(
                        params,
                        function(messagesSent) {

                            if (messagesSent.length > 0) {
                                messagesSent.forEach(function(m) {
                                    if (!(m.useridto in MM.plugins.messages.recentContactsIds)) {
                                        MM.plugins.messages.recentContactsIds[m.useridto] = {
                                            fullname: m.usertofullname,
                                            profileimageurl: ""
                                        };
                                        MM.plugins.messages.recentContactMessages.push({
                                            user: m.useridto,
                                            message: m.smallmessage,
                                            timecreated: m.timecreated,
                                        });
                                    }
                                });
                            }

                            // Now, get my contacts (the function returns unread messages count for contacts,
                            // maybe some are not included in the latest 50).
                            MM.plugins.messages._getContacts(
                                function(contacts) {
                                    var types = ["online", "offline", "strangers"];
                                    types.forEach(function(type) {
                                        if (contacts[type] && contacts[type].length > 0) {
                                            contacts[type].forEach(function(contact) {
                                                if (!(contact.id in MM.plugins.messages.recentContactsIds)) {
                                                    // Is a contact with unread messages, add it to the recent contact messages.
                                                    MM.plugins.messages.recentContactsIds[contact.id] = {
                                                        fullname: contact.fullname,
                                                        profileimageurl: ""
                                                    };

                                                    if (contact.unread) {
                                                        MM.plugins.messages.recentContactMessages.push({
                                                            user: contact.id,
                                                            message: "...",
                                                            timecreated: 0,
                                                        });
                                                    }
                                                }

                                                if (contact.profileimageurl) {
                                                    MM.plugins.messages.recentContactsIds[contact.id]["profileimageurl"] = contact.profileimageurl;
                                                }
                                                if (typeof contact.unread != "undefined") {
                                                    MM.plugins.messages.recentContactsIds[contact.id]["unread"] = contact.unread;
                                                }
                                            });
                                        }
                                    });
                                    // Save the users. Using a cache.
                                    var usersStored = [];
                                    MM.db.each("users", function(el){
                                        if(el.get("site") == MM.config.current_site.id) {
                                            usersStored.push(el.get("id"));
                                        }
                                    });

                                    var newUser;
                                    for (var userId in MM.plugins.messages.recentContactsIds) {
                                        if(MM.plugins.messages.recentContactsIds.hasOwnProperty(userId)){
                                            if (usersStored.indexOf(MM.config.current_site.id + "-" + userId) < 0) {
                                                newUser = {
                                                    'id': MM.config.current_site.id + '-' + userId,
                                                    'userid': userId,
                                                    'fullname': MM.plugins.messages.recentContactsIds[userId].fullname,
                                                    'profileimageurl': MM.plugins.messages.recentContactsIds[userId].profileimageurl
                                                };
                                                MM.db.insert('users', newUser);
                                            }
                                        }
                                    }

                                    $('a[href="#messages"]').removeClass('loading-row');
                                    var data = {
                                        messages: MM.plugins.messages.recentContactMessages,
                                        contacts: MM.plugins.messages.recentContactsIds
                                    };
                                    html = MM.tpl.render(MM.plugins.messages.templates.recent.html, data);
                                    MM.panels.show('center', html, {title: MM.lang.s("messages")});

                                    // Load the first event.
                                    if (MM.deviceType == "tablet" && messages.length > 0) {
                                        $("#panel-center li:eq(0)").addClass("selected-row");
                                        MM.plugins.messages.showConversation(data.messages[0]["user"]);
                                        $("#panel-center li:eq(0)").addClass("selected-row");
                                    }


                                },
                                function(e) {
                                    MM.log("Error retrieving contacts", "Messages");
                                }
                            );
                        },
                        function(e) {
                            MM.log("Error retrieving contacts", "Messages");
                        }
                    );
                },
                function(e) {
                    $('a[href="#messages"]').removeClass('loading-row');
                    MM.popErrorMessage(e);
                }
            );


            //$('a[href="#messages"]').removeClass('loading-row');
        },

        /**
         * Render a list of messages.
         * This function is used when the Moodle site doesn't have all the messaging functions available.
         */
        _renderMessageList: function() {

            var params = {
                useridto: MM.config.current_site.userid,
                useridfrom: 0,
                type: 'conversations',
                read: 0,
                newestfirst: 1,
                limitfrom: 0,
                limitnum: 50
            };

            MM.plugins.messages._getRecentMessages(
                params,
                function(messages) {
                    $('a[href="#messages"]').removeClass('loading-row');
                    MM.plugins.messages._renderMessages(messages);
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

        _getRecentMessages: function(params, successCallback, errorCallback) {

            params.read = 0;
            MM.plugins.messages._getMessages(
                params,
                function(messages) {
                    if (messages.messages) {
                        if (messages.messages.length >= params.limitnum) {
                            successCallback(messages.messages);
                        } else {
                            params.limitnum = params.limitnum - messages.messages.length;
                            params.read = 1;
                            // Load more messages but now read messages.
                            MM.plugins.messages._getMessages(
                                params,
                                function(moremessages) {
                                    if (moremessages.messages) {
                                        successCallback(messages.messages.concat(moremessages.messages));
                                    } else {
                                        successCallback(messages.messages);
                                    }
                                },
                                function() {
                                    successCallback(messages.messages);
                                }
                            );
                        }
                    } else {
                        if (messages.exception && messages.errorcode == "disabled") {
                            errorCallback(messages.message);
                        } else {
                            successCallback([]);
                        }
                    }
                },
                function(e) {
                    errorCallback(e);
                }
            );
        },

        /**
         * Get contacts
         * @param  {object} successCallback Success callback function
         * @param  {object} errorCallback   Error callback function
         */
        _getContacts: function(successCallback, errorCallback, settings) {
            settings = settings || {};

            var wsFn = 'core_message_get_contacts';
            if (MM.util.wsAvailable('local_mobile_core_message_get_contacts')) {
                wsFn = 'local_mobile_core_message_get_contacts';
            }

            MM.moodleWSCall(
                wsFn,
                {},
                function(contacts) {
                    if (typeof successCallback == "function") {
                        successCallback(contacts);
                    }
                },
                settings,
                function(e) {
                    if (typeof errorCallback == "function") {
                        errorCallback(e);
                    }
                }
            );
        },

        /**
         * Retrieve a list of blocked users
         * @param  {number} userId who is blocking the users
         * @param  {object} successCallback Success callback function
         * @param  {object} errorCallback   Error callback function
         */
        _getBlockedUsers: function(userId, successCallback, errorCallback) {
            var data = {
                "userid" : userId
            };

            var wsFn = 'core_message_get_blocked_users';
            if (MM.util.wsAvailable('local_mobile_core_message_get_blocked_users')) {
                wsFn = 'local_mobile_core_message_get_blocked_users';
            }

            MM.moodleWSCall(
                wsFn,
                data,
                function(result) {
                    if (result.warnings && result.warnings.length) {
                        if (typeof errorCallback == "function") {
                            errorCallback(result.warnings[0]['message']);
                        }
                        return;
                    }
                    result.users.forEach(function(user) {
                        MM.plugins.messages.blockedUsersIds[user.id] = user.id;
                        newUser = {
                            'id': MM.config.current_site.id + '-' + user.id,
                            'userid': user.id,
                            'fullname': user.fullname,
                            'profileimageurl': user.profileimageurl
                        };
                        MM.db.insert('users', newUser);
                    });
                    if (typeof successCallback == "function") {
                        successCallback(result.users);
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
         * Create a contact
         * @param  {number} userId userId to be added as contact
         * @param  {object} successCallback Success callback function
         * @param  {object} errorCallback   Error callback function
         */
        _createContact: function(userId, successCallback, errorCallback) {
            var data = {
                "userids[0]" : userId
            };

            var wsFn = 'core_message_create_contacts';
            if (MM.util.wsAvailable('local_mobile_core_message_create_contacts')) {
                wsFn = 'local_mobile_core_message_create_contacts';
            }

            MM.moodleWSCall(
                wsFn,
                data,
                function(warnings) {
                    if (warnings && warnings.length) {
                        if (typeof errorCallback == "function") {
                            errorCallback(warnings[0]['message']);
                        }
                        return;
                    }
                    if (typeof successCallback == "function") {
                        successCallback();
                    }
                },
                {
                    getFromCache: false,
                    saveToCache: false
                },
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
                "userids[0]": userId
            };

            var wsFn = 'core_message_delete_contacts';
            if (MM.util.wsAvailable('local_mobile_core_message_delete_contacts')) {
                wsFn = 'local_mobile_core_message_delete_contacts';
            }

            MM.moodleWSCall(
                wsFn,
                data,
                function(result) {
                    if (typeof successCallback == "function") {
                        successCallback();
                    }
                },
                {
                    getFromCache: false,
                    saveToCache: false
                },
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

            var wsFn = 'core_message_block_contacts';
            if (MM.util.wsAvailable('local_mobile_core_message_block_contacts')) {
                wsFn = 'local_mobile_core_message_block_contacts';
            }

            MM.moodleWSCall(
                wsFn,
                data,
                function(warnings) {
                    if (warnings && warnings.length) {
                        if (typeof errorCallback == "function") {
                            errorCallback(warnings[0]['message']);
                        }
                        return;
                    }
                    if (typeof successCallback == "function") {
                        successCallback();
                    }
                },
                {
                    getFromCache: false,
                    saveToCache: false
                },
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

            var wsFn = 'core_message_unblock_contacts';
            if (MM.util.wsAvailable('local_mobile_core_message_unblock_contacts')) {
                wsFn = 'local_mobile_core_message_unblock_contacts';
            }

            MM.moodleWSCall(
                wsFn,
                data,
                function(result) {
                    if (typeof successCallback == "function") {
                        successCallback();
                    }
                },
                {
                    getFromCache: false,
                    saveToCache: false
                },
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

            var wsFn = 'core_message_search_contacts';
            if (MM.util.wsAvailable('local_mobile_core_message_search_contacts')) {
                wsFn = 'local_mobile_core_message_search_contacts';
            }

            MM.moodleWSCall(
                wsFn,
                data,
                function(contacts) {
                    if (typeof successCallback == "function") {
                        // Save the users in the cache/db.
                        var usersStored = [];
                        MM.db.each("users", function(el){
                            if(el.get("site") == MM.config.current_site.id) {
                                usersStored.push(el.get("id"));
                            }
                        });

                        var newUser;
                        _.each(contacts, function(contact) {
                            if (usersStored.indexOf(MM.config.current_site.id + "-" + contact.id) < 0) {
                                newUser = {
                                    'id': MM.config.current_site.id + '-' + contact.id,
                                    'userid': contact.id,
                                    'fullname': contact.fullname,
                                    'profileimageurl': (contact.profileimageurl)? contact.profileimageurl : ''
                                };
                                MM.db.insert('users', newUser);
                            }
                        });
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

        _sendMessage: function(userTo, message, successCallback, errorCallback) {
            message = message.replace(/(?:\r\n|\r|\n)/g, '<br />');

            if (!message.trim()) {
                return;
            }

            var data = {
                "messages[0][touserid]" : userTo,
                "messages[0][text]" : message,
                "messages[0][textformat]" : 1
            };

            MM.moodleWSCall('moodle_message_send_instantmessages', data,
                function(r){
                    if (typeof successCallback == "function") {
                        successCallback(r);
                    }
                },
                {
                    getFromCache: false,
                    saveToCache: false
                },
                function(e) {
                    if (typeof errorCallback == "function") {
                        errorCallback(e);
                    }
                }
            );
        },

        showContacts: function() {

            MM.panels.showLoading('center');

            var fillContacts = function(blockedUsers) {
                MM.plugins.messages._getContacts(
                    function(contacts) {

                        contacts["blocked"] = blockedUsers;

                        MM.db.each("users", function(user) {
                            user = user.toJSON();
                            if(user.site == MM.config.current_site.id) {
                                user.id = user.userid;
                                contacts["strangers"].push(user);
                            }
                        });

                        html = MM.tpl.render(MM.plugins.messages.templates.contacts.html, {contacts: contacts});

                        MM.panels.show('center', html, {title: MM.lang.s("contacts")});

                        $('#search-contacts').on('submit', function(e) {
                            e.preventDefault();
                            var text = $('#search-text').val();

                            if (!text.trim()) {
                                return;
                            }
                            MM.plugins.messages._searchContacts(text, 0,
                                function(contacts) {
                                    var data = {
                                        users: contacts
                                    };
                                    var result = MM.lang.s('nousersfound');

                                    if (contacts.length) {
                                        result = MM.tpl.render(MM.plugins.messages.templates.search.html, data);
                                    }

                                    $("#contacts-list").css("display", "none");
                                    $("#search-result").css("display", "block");
                                    $("#search-result").html(result);
                                },
                                function(e) {
                                    MM.popErrorMessage(e);
                                }
                            );
                        });

                        $("#search-text").keyup(function(e) {
                            if ($(this).val() == "") {
                                $("#contacts-list").css("display", "block");
                                $("#search-result").css("display", "none");
                            }
                        });

                    },
                    function(e) {
                        MM.log("Error retrieving contacts", "Messages");
                    }
                );
            };

            MM.plugins.messages._getBlockedUsers(
                MM.config.current_site.userid,
                fillContacts,
                function(e) {
                    fillContacts([]);
                }
            );

        },

        showContact: function(userId) {
            var user = MM.db.get('users', MM.config.current_site.id + "-" + userId);
            if (!user) {
                MM.popErrorMessage("Invalid user");
                return;
            }
            user = user.toJSON();

            MM.plugins.messages._getContacts(
                function(contacts) {
                    var isContact = false;
                    var types = ["online", "offline"];
                    types.forEach(function(type) {
                        if (contacts[type] && contacts[type].length > 0) {
                            contacts[type].forEach(function(contact) {
                                if (contact.id == user.userid) {
                                    isContact = true;
                                    return;
                                }
                            });
                        }
                    });

                    var isBlocked = false;
                    if (typeof MM.plugins.messages.blockedUsersIds[userId] != "undefined") {
                        isBlocked = true;
                    }

                    var data = {
                        user: user,
                        isContact: isContact,
                        isBlocked: isBlocked
                    };

                    var html = MM.tpl.render(MM.plugins.messages.templates.contact.html, data);
                    MM.panels.show('right', html, {title: MM.lang.s("info")});

                    $(".add-remove-contact").on(MM.clickType, function(e) {
                        var userId = $(this).data("userid");
                        var add = $(this).data("add");
                        $(this).addClass("loading-row-black");

                        var fn = "_createContact";
                        if (parseInt(add, 10) === 0) {
                            fn = "_deleteContact";
                        }
                        MM.plugins.messages[fn](
                            userId,
                            function() {
                                MM.plugins.messages.showContact(userId);
                            },
                            function(e) {
                                $(this).removeClass("loading-row-black");
                                MM.popErrorMessage(e);
                            }
                        );
                    });

                    $(".block-unblock-contact").on(MM.clickType, function(e) {
                        var userId = $(this).data("userid");
                        var block = parseInt($(this).data("block"), 10);
                        $(this).addClass("loading-row-black");

                        var fn = "_blockContact";
                        if (block === 0) {
                            fn = "_unblockContact";
                        }
                        MM.plugins.messages[fn](
                            userId,
                            function() {
                                // Refresh cache of blocked users.
                                if (block === 0) {
                                    delete MM.plugins.messages.blockedUsersIds[userId];
                                } else {
                                    MM.plugins.messages.blockedUsersIds[userId] = userId;
                                }
                                MM.plugins.messages.showContact(userId);
                            },
                            function(e) {
                                $(this).removeClass("loading-row-black");
                                MM.popErrorMessage(e);
                            }
                        );
                    });

                },
                function(e) {
                    MM.log("Error retrieving contacts", "Messages");
                },
                {
                    getFromCache: false,
                    saveToCache: true
                }
            );
        },

        _pollingMessages: function(userId) {
            if (location.href.indexOf("#messages/conversation/" + userId) > -1) {
                var params = {
                    useridto: MM.config.current_site.userid,
                    useridfrom: userId,
                    type: 'conversations',
                    read: 0,
                    newestfirst: 1,
                    limitfrom: 0,
                    limitnum: 5
                };

                // First, messages received.
                MM.plugins.messages._getRecentMessages(
                    params,
                    function(messagesReceived) {
                        // Now, messages sent.
                        params.useridto = userId;
                        params.useridfrom = MM.config.current_site.userid;

                        MM.plugins.messages._getRecentMessages(
                            params,
                            function(messagesSent) {
                                // Remove rendered messages.
                                var rendered = [];

                                $(".bubble").each(function() {
                                    rendered.push($(this).data("messageid"));
                                });

                                var messages = messagesReceived.concat(messagesSent);
                                // Sort by timecreated.
                                messages = messages.sort(function (a, b) {
                                    a = parseInt(a.timecreated, 10);
                                    b = parseInt(b.timecreated, 10);

                                    return a - b;
                                });

                                for(var i = messages.length -1; i >= 0 ; i--){
                                    var m = messages[i];
                                    var id = m.useridfrom + "-" + m.id + "-" + m.timecreated;
                                    if(rendered.indexOf(id) > -1){
                                        messages.splice(i, 1);
                                    }
                                }

                                if (messages.length > 0) {
                                    var d = new Date(messages[0].timecreated * 1000);
                                    var previousDate = MM.util.toLocaleDateString(d, MM.lang.current, {year: 'numeric', month:'long', day: '2-digit'});

                                    var html = MM.plugins.messages._renderConversationArea(messages, userId, previousDate);
                                    // Double check we are in the correct conversation window.
                                    if (location.href.indexOf("#messages/conversation/" + userId) > -1) {
                                        conversationArea = $(".conversation-area");
                                        conversationArea.find(".removeMessage").remove();
                                        conversationArea.append(html);
                                        conversationArea.scrollTop(conversationArea.prop("scrollHeight"));
                                    }
                                }

                                setTimeout(function() {
                                    MM.plugins.messages._pollingMessages(userId);
                                }, MM.plugins.messages.pollingInterval);
                            },
                            function(e) {
                                setTimeout(function() {
                                    MM.plugins.messages._pollingMessages(userId);
                                }, MM.plugins.messages.pollingInterval);
                            }
                        );
                    },
                    function(e) {
                        setTimeout(function() {
                            MM.plugins.messages._pollingMessages(userId);
                        }, MM.plugins.messages.pollingInterval);
                    }
                );
            }
        },

        _renderConversationArea: function(messages, userId, previousDate) {
            var data = {
                messages: messages,
                otherUser: userId,
                previousDate: previousDate
            };

            return MM.tpl.render(MM.plugins.messages.templates.bubbles.html, data);
        }
    };

    MM.registerPlugin(plugin);

    // After register the plugin, bind events.
    $(document).bind('resume', MM.plugins.messages.check);
});