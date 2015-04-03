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

        _displayMessageForm: function(userId) {
            var sendMessage = MM.lang.s("send");

            var options = {
                title: MM.lang.s("sendmessage"),
                width: "90%",
                buttons: {}
            };

            options.buttons[sendMessage] = function() {

                var loadB = $(".modal-button-1");
                loadB.addClass("loading-row-black");

                var messageText = $("#sendmessagetext").val();
                messageText = messageText.replace(/(?:\r\n|\r|\n)/g, '<br />');

                var data = {
                    "messages[0][touserid]" : userId,
                    "messages[0][text]" : messageText,
                    "messages[0][textformat]" : 1
                };

                MM.moodleWSCall('moodle_message_send_instantmessages', data,
                    function(r){
                        loadB.removeClass("loading-row-black");
                        MM.popMessage(MM.lang.s("messagesent"), {autoclose: 1500});
                    },
                    {
                        sync: true,
                        syncData: {
                            name: sendMessage,
                            description: $("#sendmessagetext").val().substr(0, 30)
                        },
                        getFromCache: false,
                        saveToCache: false
                    },
                    function(e) {
                        loadB.removeClass("loading-row-black");
                        MM.widgets.dialogClose();
                    }
                    );
            };
            options.buttons[MM.lang.s("cancel")] = function() {
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
            // Display keyboard.
            setTimeout(function() {
                $('#sendmessagetext').focus();
                MM.util.showKeyboard();
            }, 300);
        },

        sendMessage: function(courseId, userId) {
            MM.plugins.sendmessage._displayMessageForm(userId);
            // Refresh the hash url for avoid navigation problems.
            MM.Router.navigate("participant/" + courseId + "/" + userId);
        }
    }

    MM.registerPlugin(plugin);
});