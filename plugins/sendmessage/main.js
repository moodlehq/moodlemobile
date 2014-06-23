define(function () {
    var plugin = {
        settings: {
            name: "sendmessage",
            type: "user",
            menuURL: "#message",
            lang: {
                component: "core"
            }
        },

        routes: [
            ["message/:courseId/:userId", "message", "sendMessage"]
        ],

        sendMessage: function(courseId, userId) {
            var sendMessage = MM.lang.s("sendmessage");

            var options = {
                title: sendMessage,
                width: "90%",
                buttons: {}
            };

            options.buttons[sendMessage] = function() {

                var data = {
                    "messages[0][touserid]" : userId,
                    "messages[0][text]" : $("#sendmessagetext").val()
                }

                MM.widgets.dialogClose();
                MM.moodleWSCall('moodle_message_send_instantmessages', data,
                    function(r){
                        MM.popMessage(MM.lang.s("messagesent"));
                    },
                    {
                        sync: true,
                        syncData: {
                            name: sendMessage,
                            description: $("#sendmessagetext").val().substr(0, 30)
                        },
                        getFromCache: false,
                        saveToCache: false
                    }
                    );

                // Refresh the hash url for avoid navigation problems.
                MM.Router.navigate("participant/" + courseId + "/" + userId);
            };
            options.buttons[MM.lang.s("cancel")] = function() {
                MM.Router.navigate("participant/" + courseId + "/" + userId);
                MM.widgets.dialogClose();
            };

            var rows = 5;
            var cols = 5;
            if (MM.deviceType == "tablet") {
                rows = 15;
                cols = 50;
            }

            var html = '\
            <textarea id="sendmessagetext" rows="'+rows+'" cols="'+cols+'"></textarea>\
            ';

            MM.widgets.dialog(html, options);
        }
    }

    MM.registerPlugin(plugin);
});