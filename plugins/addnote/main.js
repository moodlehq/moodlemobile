define(function () {
    var plugin = {
        settings: {
            name: "addnote",
            type: "user",
            menuURL: "#note",
            lang: {
                component: "moodle"
            }
        },
        
        routes: [
            ["note/:userId", "note", "addNote"]
        ],
        
        addNote: function(userId) {
            window.alert("add note" + userId);
        }
    }
    
    MM.registerPlugin(plugin);
});