define(function () {
    var plugin = {
        settings: {
            name: "addnote",
            type: "user",
            menuURL: "#note",
            lang: {
                component: "core"
            }
        },

        routes: [
            ["note/:courseId/:userId", "note", "addNote"]
        ],

        addNote: function(courseId, userId) {
            var addNote = MM.lang.s("addnote");

            var options = {
                title: addNote,
                width: "90%",
                buttons: {}
            };

            options.buttons[addNote] = function() {

                var data = {
                    "notes[0][userid]" : userId,
                    "notes[0][publishstate]": 'personal',
                    "notes[0][courseid]": courseId,
                    "notes[0][text]": $("#addnotetext").val(),
                    "notes[0][format]": 1
                }

                MM.widgets.dialogClose();
                MM.moodleWSCall('moodle_notes_create_notes', data,
                    function(r){
                        MM.popMessage(MM.lang.s("noteadded"));
                    },
                    {
                        sync: true,
                        syncData: {
                            name: addNote,
                            description: $("#addnotetext").val().substr(0, 30)
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
            <textarea id="addnotetext" rows="'+rows+'" cols="'+cols+'"></textarea>\
            ';

            MM.widgets.dialog(html, options);
        }
    }

    MM.registerPlugin(plugin);
});